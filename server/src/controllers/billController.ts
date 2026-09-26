import { Request, Response, NextFunction } from 'express';
import { billService } from '../services/billService.js';
import { successResponse } from '../utils/apiResponse.js';

export const billController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bill = await billService.create(req.user.id, req.body);
      successResponse(res, bill, 'Bill created successfully', 201);
    } catch (err) { next(err); }
  },

  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string;
      const bills = await billService.getAll(req.user.id, status);
      successResponse(res, bills, 'Bills retrieved successfully', 200);
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bill = await billService.getById(req.user.id, req.params.id);
      successResponse(res, bill, 'Bill retrieved successfully', 200);
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await billService.update(req.user.id, req.params.id, req.body);
      successResponse(res, updated, 'Bill updated successfully', 200);
    } catch (err) { next(err); }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await billService.delete(req.user.id, req.params.id);
      successResponse(res, result, 'Bill deleted successfully', 200);
    } catch (err) { next(err); }
  },

  markPaid: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await billService.markPaid(req.user.id, req.params.id, req.body);
      successResponse(res, result, 'Bill marked as paid', 200);
    } catch (err) { next(err); }
  },

  getUpcoming: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const bills = await billService.getUpcoming(req.user.id, days);
      successResponse(res, bills, 'Upcoming bills retrieved', 200);
    } catch (err) { next(err); }
  }
};