import { Request, Response, NextFunction } from 'express';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { Bill } from '../models/Bill.js';
import { Goal } from '../models/Goal.js';
import { Account } from '../models/Account.js';
import { successResponse } from '../utils/apiResponse.js';

export const searchController = {
  globalSearch: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = (req.query.q as string || '').trim();
      const userId = req.user.id;

      if (!q) {
        return successResponse(res, { transactions: [], budgets: [], bills: [], goals: [], accounts: [] });
      }

      const regex = new RegExp(q, 'i');

      const [transactions, budgets, bills, goals, accounts] = await Promise.all([
        Transaction.find({
          userId,
          $or: [{ description: regex }, { merchant: regex }, { category: regex }, { notes: regex }]
        }).limit(8).sort({ date: -1 }),
        Budget.find({ userId, category: regex }).limit(5),
        Bill.find({ userId, $or: [{ name: regex }, { merchant: regex }, { category: regex }] }).limit(5),
        Goal.find({ userId, name: regex }).limit(5),
        Account.find({ userId, name: regex }).limit(5)
      ]);

      successResponse(res, {
        query: q,
        transactions,
        budgets,
        bills,
        goals,
        accounts
      }, 'Global search results', 200);
    } catch (err) { next(err); }
  }
};
