import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/aiService.js';
import { successResponse } from '../utils/apiResponse.js';

export const aiController = {
  getSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await aiService.generateSpendingSummary(req.user.id);
      successResponse(res, { summary }, 'AI summary generated', 200);
    } catch (err) { next(err); }
  },

  query: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question } = req.body;
      const answer = await aiService.answerQuery(req.user.id, question);
      successResponse(res, { answer }, 'Sage response generated', 200);
    } catch (err) { next(err); }
  },

  categorize: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { description } = req.body;
      const suggestion = await aiService.categorizeSuggestion(description, req.user.id);
      successResponse(res, suggestion, 'Category suggested', 200);
    } catch (err) { next(err); }
  },

  detectAnomalies: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const anomalies = await aiService.detectAnomalies(req.user.id);
      successResponse(res, anomalies, 'Anomalies detected', 200);
    } catch (err) { next(err); }
  },

  forecast: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const months = parseInt(req.query.months as string) || 3;
      const result = await aiService.forecast(req.user.id, months);
      successResponse(res, result, 'Forecast generated', 200);
    } catch (err) { next(err); }
  },

  whatIf: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await aiService.whatIfAnalysis(req.user.id, req.body);
      successResponse(res, result, 'What-if analysis calculated', 200);
    } catch (err) { next(err); }
  }
};