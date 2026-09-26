import { Request, Response, NextFunction } from 'express';
import { accountService } from '../services/accountService.js';
import { successResponse } from '../utils/apiResponse.js';

export const accountController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const account = await accountService.create(req.user.id, req.body);
      successResponse(res, account, 'Account created successfully', 201);
    } catch (err) { next(err); }
  },

  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accounts = await accountService.getAll(req.user.id);
      successResponse(res, accounts, 'Accounts retrieved successfully', 200);
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const account = await accountService.getById(req.user.id, req.params.id);
      successResponse(res, account, 'Account retrieved successfully', 200);
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await accountService.update(req.user.id, req.params.id, req.body);
      successResponse(res, updated, 'Account updated successfully', 200);
    } catch (err) { next(err); }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await accountService.delete(req.user.id, req.params.id);
      successResponse(res, result, 'Account deleted successfully', 200);
    } catch (err) { next(err); }
  },

  transfer: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await accountService.transfer(req.user.id, req.body);
      successResponse(res, result, 'Transfer processed successfully', 200);
    } catch (err) { next(err); }
  },

  getSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await accountService.getBalanceSummary(req.user.id);
      successResponse(res, summary, 'Balance summary retrieved', 200);
    } catch (err) { next(err); }
  }
};