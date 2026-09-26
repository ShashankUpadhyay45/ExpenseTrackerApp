import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/reportService.js';
import { successResponse } from '../utils/apiResponse.js';

export const reportController = {
  generate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await reportService.generateReportData(req.user.id, req.body);
      successResponse(res, data, 'Report data generated successfully', 200);
    } catch (err) { next(err); }
  },

  downloadPDF: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query as Record<string, string>;
      const doc = await reportService.generatePDFStream(req.user.id, startDate, endDate);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=SpendSage_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      doc.pipe(res);
    } catch (err) { next(err); }
  },

  exportCSV: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query as Record<string, string>;
      const csvData = await reportService.exportCSV(req.user.id, startDate, endDate);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=SpendSage_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
      res.status(200).send(csvData);
    } catch (err) { next(err); }
  },

  exportJSON: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jsonData = await reportService.exportJSON(req.user.id);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=SpendSage_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      res.status(200).json(jsonData);
    } catch (err) { next(err); }
  }
};