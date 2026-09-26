import { Goal } from '../models/Goal.js';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { AppError } from '../utils/AppError.js';

export const goalService = {
  create: async (userId: string, data: any) => {
    const goal = await Goal.create({
      ...data,
      userId,
      currentAmount: data.currentAmount || 0,
      targetDate: new Date(data.targetDate),
      status: 'active'
    });
    return goal;
  },

  getAll: async (userId: string) => {
    const goals = await Goal.find({ userId }).sort({ status: 1, targetDate: 1 });
    const now = new Date();

    return goals.map(g => {
      const goal = g.toObject();
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      const percentage = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
      
      const targetDate = new Date(goal.targetDate);
      const diffTime = targetDate.getTime() - now.getTime();
      const monthsRemaining = Math.max(1, diffTime / (1000 * 60 * 60 * 24 * 30.44));
      const weeksRemaining = Math.max(1, diffTime / (1000 * 60 * 60 * 24 * 7));

      const requiredMonthlyContribution = Math.round((remaining / monthsRemaining) * 100) / 100;
      const requiredWeeklyContribution = Math.round((remaining / weeksRemaining) * 100) / 100;

      return {
        ...goal,
        remaining,
        percentage,
        isCompleted: goal.currentAmount >= goal.targetAmount,
        requiredMonthlyContribution,
        requiredWeeklyContribution
      };
    });
  },

  getById: async (userId: string, id: string) => {
    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) throw new AppError('Goal not found', 404);
    return goal;
  },

  update: async (userId: string, id: string, data: any) => {
    if (data.targetDate) data.targetDate = new Date(data.targetDate);
    const goal = await Goal.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!goal) throw new AppError('Goal not found', 404);
    return goal;
  },

  delete: async (userId: string, id: string) => {
    const goal = await Goal.findOneAndDelete({ _id: id, userId });
    if (!goal) throw new AppError('Goal not found', 404);
    return { message: 'Goal deleted successfully' };
  },

  addContribution: async (userId: string, id: string, contributionData: { amount: number; note?: string; date?: string; accountId?: string }) => {
    const { amount, note, date = new Date().toISOString(), accountId } = contributionData;
    if (amount <= 0) throw new AppError('Contribution amount must be greater than zero', 400);

    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) throw new AppError('Goal not found', 404);

    // If an account is selected, deduct funds and register transaction
    if (accountId) {
      const account = await Account.findOne({ _id: accountId, userId });
      if (account) {
        account.balance -= amount;
        await account.save();

        await Transaction.create({
          userId,
          accountId,
          type: 'expense',
          amount,
          date: new Date(date),
          category: 'Savings',
          description: `Goal Contribution: ${goal.name}${note ? ` (${note})` : ''}`
        });
      }
    }

    goal.currentAmount += amount;
    goal.contributions.push({
      amount,
      note,
      date: new Date(date)
    });

    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
    }

    await goal.save();
    return goal;
  }
};