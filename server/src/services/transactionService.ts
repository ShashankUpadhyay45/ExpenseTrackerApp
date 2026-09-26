import { Transaction } from '../models/Transaction.js';
import { Account } from '../models/Account.js';
import { Budget } from '../models/Budget.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

export const transactionService = {
  async create(userId: string, data: any) {
    const account = await Account.findOne({ _id: data.accountId, userId });
    if (!account) throw new AppError('Account not found', 404);

    const transaction = await Transaction.create({ ...data, userId });

    if (data.type === 'income') account.balance += data.amount;
    else if (data.type === 'expense') account.balance -= data.amount;
    await account.save();

    if (data.type === 'expense') {
      const budget = await Budget.findOne({ userId, category: data.category });
      if (budget) {
        budget.spent += data.amount;
        await budget.save();
      }
    }

    return transaction;
  },

  async getAll(userId: string, query: any) {
    const filter: any = { userId };
    if (query.type) filter.type = query.type;
    if (query.category) filter.category = query.category;
    if (query.merchant) filter.merchant = new RegExp(query.merchant, 'i');
    if (query.dateFrom || query.dateTo) {
      filter.date = {};
      if (query.dateFrom) filter.date.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.date.$lte = new Date(query.dateTo);
    }
    if (query.accountId) filter.accountId = query.accountId;
    if (query.tags) filter.tags = { $in: Array.isArray(query.tags) ? query.tags : [query.tags] };

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const sort: any = {};
    if (query.sortBy) sort[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;
    else sort.date = -1;

    const transactions = await Transaction.find(filter).sort(sort).skip(skip).limit(limit).lean();
    const total = await Transaction.countDocuments(filter);

    return { transactions, page, limit, total };
  },

  async getById(userId: string, id: string) {
    const transaction = await Transaction.findOne({ _id: id, userId }).lean();
    if (!transaction) throw new AppError('Transaction not found', 404);
    return transaction;
  },

  async update(userId: string, id: string, data: any) {
    const tx = await Transaction.findOne({ _id: id, userId });
    if (!tx) throw new AppError('Transaction not found', 404);
    
    if (tx.accountId.toString() === data.accountId || !data.accountId) {
       const account = await Account.findById(tx.accountId);
       if (account) {
          if (tx.type === 'expense') account.balance += tx.amount;
          else if (tx.type === 'income') account.balance -= tx.amount;
          
          const newType = data.type || tx.type;
          const newAmt = data.amount || tx.amount;
          if (newType === 'expense') account.balance -= newAmt;
          else if (newType === 'income') account.balance += newAmt;
          
          await account.save();
       }
    }
    Object.assign(tx, data);
    await tx.save();
    return tx;
  },

  async delete(userId: string, id: string) {
    const tx = await Transaction.findOne({ _id: id, userId });
    if (!tx) throw new AppError('Transaction not found', 404);
    
    const account = await Account.findById(tx.accountId);
    if (account) {
       if (tx.type === 'expense') account.balance += tx.amount;
       else if (tx.type === 'income') account.balance -= tx.amount;
       await account.save();
    }
    
    if (tx.type === 'expense') {
      const budget = await Budget.findOne({ userId, category: tx.category });
      if (budget) {
        budget.spent -= tx.amount;
        await budget.save();
      }
    }
    
    await tx.deleteOne();
    return null;
  },

  async bulkDelete(userId: string, ids: string[]) {
    await Transaction.deleteMany({ _id: { $in: ids }, userId });
    return null;
  },

  async duplicate(userId: string, id: string) {
    const tx = await Transaction.findOne({ _id: id, userId }).lean();
    if (!tx) throw new AppError('Transaction not found', 404);
    
    const { _id, createdAt, updatedAt, ...rest } = tx as any;
    rest.date = new Date();
    
    const newTx = await Transaction.create(rest);
    return newTx;
  },

  async search(userId: string, term: string) {
    const regex = new RegExp(term, 'i');
    return Transaction.find({
      userId,
      $or: [{ description: regex }, { merchant: regex }, { notes: regex }, { category: regex }]
    }).limit(50).lean();
  },

  async getDuplicates(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { amount: "$amount", date: "$date", description: "$description" }, docs: { $push: "$$ROOT" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
  }
};