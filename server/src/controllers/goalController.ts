import { Request, Response, NextFunction } from 'express';
import { goalService } from '../services/goalService.js';
import { successResponse } from '../utils/apiResponse.js';

export const goalController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goal = await goalService.create(req.user.id, req.body);
      successResponse(res, goal, 'Goal created successfully', 201);
    } catch (err) { next(err); }
  },

  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goals = await goalService.getAll(req.user.id);
      successResponse(res, goals, 'Goals retrieved successfully', 200);
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goal = await goalService.getById(req.user.id, req.params.id);
      successResponse(res, goal, 'Goal retrieved successfully', 200);
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await goalService.update(req.user.id, req.params.id, req.body);
      successResponse(res, updated, 'Goal updated successfully', 200);
    } catch (err) { next(err); }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await goalService.delete(req.user.id, req.params.id);
      successResponse(res, result, 'Goal deleted successfully', 200);
    } catch (err) { next(err); }
  },

  addContribution: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await goalService.addContribution(req.user.id, req.params.id, req.body);
      successResponse(res, updated, 'Contribution added successfully', 200);
    } catch (err) { next(err); }
  }
};