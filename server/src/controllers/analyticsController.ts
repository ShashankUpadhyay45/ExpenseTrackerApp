import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analyticsService.js';
import { successResponse } from '../utils/apiResponse.js';

export const analyticsController = {
  getDashboard: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await analyticsService.getDashboard(req.user.id);
      successResponse(res, stats, 'Dashboard metrics retrieved', 200);
    } catch (err) { next(err); }
  },

  getMonthlySummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const month = req.query.month as string;
      const summary = await analyticsService.getMonthlySummary(req.user.id, month);
      successResponse(res, summary, 'Monthly summary retrieved', 200);
    } catch (err) { next(err); }
  },

  getIncomeVsExpenses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const data = await analyticsService.getIncomeVsExpenses(req.user.id, months);
      successResponse(res, data, 'Income vs expenses data retrieved', 200);
    } catch (err) { next(err); }
  },

  getCategoryTrends: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const data = await analyticsService.getCategoryTrends(req.user.id, months);
      successResponse(res, data, 'Category trends retrieved', 200);
    } catch (err) { next(err); }
  },

  getMerchantTrends: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await analyticsService.getMerchantTrends(req.user.id, limit);
      successResponse(res, data, 'Merchant trends retrieved', 200);
    } catch (err) { next(err); }
  },

  getSpendingByDayOfWeek: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsService.getSpendingByDayOfWeek(req.user.id);
      successResponse(res, data, 'Day of week spending retrieved', 200);
    } catch (err) { next(err); }
  },

  getCashFlowTrend: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const data = await analyticsService.getCashFlowTrend(req.user.id, months);
      successResponse(res, data, 'Cash flow trend retrieved', 200);
    } catch (err) { next(err); }
  },

  getPeriodComparison: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { period1Start, period1End, period2Start, period2End } = req.query as Record<string, string>;
      const data = await analyticsService.getPeriodComparison(req.user.id, period1Start, period1End, period2Start, period2End);
      successResponse(res, data, 'Period comparison retrieved', 200);
    } catch (err) { next(err); }
  },

  getLargestTransactions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await analyticsService.getLargestTransactions(req.user.id, limit);
      successResponse(res, data, 'Largest transactions retrieved', 200);
    } catch (err) { next(err); }
  }
};