import { Request, Response, NextFunction } from 'express';
import { receiptService } from '../services/receiptService.js';
import { successResponse } from '../utils/apiResponse.js';

export const receiptController = {
  upload: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const receipt = await receiptService.processReceipt(req.user.id, req.file as Express.Multer.File);
      successResponse(res, receipt, 'Receipt uploaded and OCR processed successfully', 201);
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const receipt = await receiptService.getById(req.user.id, req.params.id);
      successResponse(res, receipt, 'Receipt retrieved successfully', 200);
    } catch (err) { next(err); }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await receiptService.delete(req.user.id, req.params.id);
      successResponse(res, result, 'Receipt deleted successfully', 200);
    } catch (err) { next(err); }
  }
};