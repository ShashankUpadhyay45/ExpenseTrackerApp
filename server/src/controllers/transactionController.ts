import { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transactionService.js';
import { successResponse } from '../utils/apiResponse.js';

export const transactionController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transaction = await transactionService.create(req.user.id, req.body);
      successResponse(res, transaction, 'Transaction created successfully', 201);
    } catch (err) { next(err); }
  },

  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await transactionService.getAll(req.user.id, req.query);
      successResponse(res, result, 'Transactions fetched successfully', 200);
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transaction = await transactionService.getById(req.user.id, req.params.id);
      successResponse(res, transaction, 'Transaction retrieved successfully', 200);
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await transactionService.update(req.user.id, req.params.id, req.body);
      successResponse(res, updated, 'Transaction updated successfully', 200);
    } catch (err) { next(err); }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await transactionService.delete(req.user.id, req.params.id);
      successResponse(res, null, 'Transaction deleted successfully', 200);
    } catch (err) { next(err); }
  },

  bulkDelete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = req.body;
      await transactionService.bulkDelete(req.user.id, ids);
      successResponse(res, null, `${ids?.length || 0} transactions deleted`, 200);
    } catch (err) { next(err); }
  },

  duplicate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const duplicated = await transactionService.duplicate(req.user.id, req.params.id);
      successResponse(res, duplicated, 'Transaction duplicated successfully', 201);
    } catch (err) { next(err); }
  },

  search: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const term = (req.query.q as string) || '';
      const results = await transactionService.search(req.user.id, term);
      successResponse(res, results, 'Search completed', 200);
    } catch (err) { next(err); }
  },

  getDuplicates: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const duplicates = await transactionService.getDuplicates(req.user.id);
      successResponse(res, duplicates, 'Duplicate scan completed', 200);
    } catch (err) { next(err); }
  }
};