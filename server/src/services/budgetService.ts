import { Budget } from '../models/Budget.js';
import { Transaction } from '../models/Transaction.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

export const budgetService = {
  create: async (userId: string, data: any) => {
    // Check if active budget for this category already exists
    const existing = await Budget.findOne({
      userId,
      category: data.category,
      isActive: true,
      period: data.period || 'monthly'
    });

    if (existing) {
      throw new AppError(`An active budget for category "${data.category}" already exists`, 400);
    }

    const now = new Date();
    const startDate = data.startDate ? new Date(data.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = data.endDate ? new Date(data.endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Calculate initial spent from transactions in the period
    const spentAggregate = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'expense',
          category: data.category,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const initialSpent = spentAggregate.length > 0 ? spentAggregate[0].total : 0;

    const budget = await Budget.create({
      ...data,
      userId,
      startDate,
      endDate,
      spent: initialSpent,
      period: data.period || 'monthly'
    });

    return budget;
  },

  getAll: async (userId: string) => {
    const budgets = await Budget.find({ userId, isActive: true }).sort({ category: 1 });
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const daysInMonth = currentMonthEnd.getDate();
    const currentDay = now.getDate();
    const daysRemaining = Math.max(1, daysInMonth - currentDay);

    // Calculate live spent for each category
    const userObjectId = new (await import('mongoose')).default.Types.ObjectId(userId);
    const spendingAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: 'expense',
          date: { $gte: currentMonthStart, $lte: currentMonthEnd }
        }
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' }
        }
      }
    ]);

    const spentMap: Record<string, number> = {};
    spendingAgg.forEach(item => {
      spentMap[item._id] = item.totalSpent;
    });

    return budgets.map(b => {
      const budgetObj = b.toObject();
      const liveSpent = spentMap[b.category] || 0;
      const remaining = Math.max(0, b.amount - liveSpent);
      const percentage = b.amount > 0 ? Math.min(100, Math.round((liveSpent / b.amount) * 100)) : 0;
      const dailyPace = remaining / daysRemaining;
      const projectedMonthEnd = currentDay > 0 ? (liveSpent / currentDay) * daysInMonth : liveSpent;
      const isOverBudget = liveSpent > b.amount;

      return {
        ...budgetObj,
        spent: liveSpent,
        remaining,
        percentage,
        dailyPace: Math.round(dailyPace * 100) / 100,
        projectedMonthEnd: Math.round(projectedMonthEnd * 100) / 100,
        isOverBudget,
        status: percentage >= 90 ? 'danger' : percentage >= 75 ? 'warn' : 'safe'
      };
    });
  },

  getById: async (userId: string, id: string) => {
    const budget = await Budget.findOne({ _id: id, userId });
    if (!budget) throw new AppError('Budget not found', 404);
    return budget;
  },

  update: async (userId: string, id: string, data: any) => {
    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!budget) throw new AppError('Budget not found', 404);
    return budget;
  },

  delete: async (userId: string, id: string) => {
    const budget = await Budget.findOneAndDelete({ _id: id, userId });
    if (!budget) throw new AppError('Budget not found', 404);
    return { message: 'Budget deleted successfully' };
  }
};