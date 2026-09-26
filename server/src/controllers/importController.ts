import { Request, Response, NextFunction } from 'express';
import { importService } from '../services/importService.js';
import { successResponse } from '../utils/apiResponse.js';

export const importController = {
  importCSV: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : undefined;
      const result = await importService.processCSV(req.user.id, req.file as Express.Multer.File, mapping);
      successResponse(res, result, 'CSV processed successfully', 201);
    } catch (err) { next(err); }
  },

  importJSON: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await importService.processJSON(req.user.id, req.file as Express.Multer.File);
      successResponse(res, result, 'JSON backup restored successfully', 201);
    } catch (err) { next(err); }
  },

  getJobStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await importService.getJobStatus(req.user.id, req.params.id);
      successResponse(res, job, 'Import job retrieved', 200);
    } catch (err) { next(err); }
  }
};