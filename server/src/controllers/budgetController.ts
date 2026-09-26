import { Request, Response, NextFunction } from 'express';
import { budgetService } from '../services/budgetService.js';
import { successResponse } from '../utils/apiResponse.js';

export const budgetController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const budget = await budgetService.create(req.user.id, req.body);
      successResponse(res, budget, 'Budget created successfully', 201);
    } catch (err) { next(err); }
  },

  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const budgets = await budgetService.getAll(req.user.id);
      successResponse(res, budgets, 'Budgets retrieved successfully', 200);
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const budget = await budgetService.getById(req.user.id, req.params.id);
      successResponse(res, budget, 'Budget retrieved successfully', 200);
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await budgetService.update(req.user.id, req.params.id, req.body);
      successResponse(res, updated, 'Budget updated successfully', 200);
    } catch (err) { next(err); }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await budgetService.delete(req.user.id, req.params.id);
      successResponse(res, result, 'Budget deleted successfully', 200);
    } catch (err) { next(err); }
  }
};