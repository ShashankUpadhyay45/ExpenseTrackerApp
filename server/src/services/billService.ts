import { Bill } from '../models/Bill.js';
import { Transaction } from '../models/Transaction.js';
import { Account } from '../models/Account.js';
import { AppError } from '../utils/AppError.js';

function computeNextDate(currentDate: Date, frequency: string): Date {
  const d = new Date(currentDate);
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'quarterly':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export const billService = {
  create: async (userId: string, data: any) => {
    const dueDate = new Date(data.dueDate);
    const nextDueDate = data.nextDueDate ? new Date(data.nextDueDate) : dueDate;

    const bill = await Bill.create({
      ...data,
      userId,
      dueDate,
      nextDueDate,
      isPaid: false
    });
    return bill;
  },

  getAll: async (userId: string, status?: string) => {
    const query: any = { userId, isActive: true };
    const now = new Date();

    const bills = await Bill.find(query).sort({ nextDueDate: 1 });

    const formattedBills = bills.map(bill => {
      const b = bill.toObject();
      const nextDue = new Date(b.nextDueDate);
      const diffTime = nextDue.getTime() - now.getTime();
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let computedStatus: 'paid' | 'upcoming' | 'overdue' = 'upcoming';
      if (b.isPaid) {
        computedStatus = 'paid';
      } else if (daysUntilDue < 0) {
        computedStatus = 'overdue';
      }

      return {
        ...b,
        daysUntilDue,
        computedStatus
      };
    });

    if (status === 'upcoming') {
      return formattedBills.filter(b => b.computedStatus === 'upcoming');
    } else if (status === 'paid') {
      return formattedBills.filter(b => b.computedStatus === 'paid');
    } else if (status === 'overdue') {
      return formattedBills.filter(b => b.computedStatus === 'overdue');
    }

    return formattedBills;
  },

  getById: async (userId: string, id: string) => {
    const bill = await Bill.findOne({ _id: id, userId });
    if (!bill) throw new AppError('Bill not found', 404);
    return bill;
  },

  update: async (userId: string, id: string, data: any) => {
    if (data.dueDate && !data.nextDueDate) {
      data.nextDueDate = data.dueDate;
    }
    const bill = await Bill.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!bill) throw new AppError('Bill not found', 404);
    return bill;
  },

  delete: async (userId: string, id: string) => {
    const bill = await Bill.findOneAndDelete({ _id: id, userId });
    if (!bill) throw new AppError('Bill not found', 404);
    return { message: 'Bill deleted successfully' };
  },

  markPaid: async (userId: string, id: string, options: { accountId?: string; amount?: number; date?: string } = {}) => {
    const bill = await Bill.findOne({ _id: id, userId });
    if (!bill) throw new AppError('Bill not found', 404);

    const paidAmount = options.amount || bill.amount;
    const paidDate = options.date ? new Date(options.date) : new Date();

    let transactionId: any = undefined;

    // If an account is provided, automatically record an expense transaction
    if (options.accountId) {
      const account = await Account.findOne({ _id: options.accountId, userId });
      if (account) {
        account.balance -= paidAmount;
        await account.save();

        const transaction = await Transaction.create({
          userId,
          accountId: options.accountId,
          type: 'expense',
          amount: paidAmount,
          date: paidDate,
          category: bill.category || 'Bills',
          merchant: bill.merchant || bill.name,
          description: `Bill Payment: ${bill.name}`,
          isRecurring: true
        });
        transactionId = transaction._id;
      }
    }

    bill.paymentHistory.push({
      date: paidDate,
      amount: paidAmount,
      transactionId
    });

    bill.isPaid = true;
    bill.lastPaidDate = paidDate;
    // Advance next due date according to frequency
    bill.nextDueDate = computeNextDate(bill.nextDueDate || bill.dueDate, bill.frequency);

    await bill.save();

    return bill;
  },

  getUpcoming: async (userId: string, daysAhead: number = 30) => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    return await Bill.find({
      userId,
      isActive: true,
      nextDueDate: { $gte: now, $lte: cutoff }
    }).sort({ nextDueDate: 1 });
  }
};