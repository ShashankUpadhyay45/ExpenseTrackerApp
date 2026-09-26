import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService.js';
import { successResponse } from '../utils/apiResponse.js';

export const notificationController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      // Auto trigger check for alerts on fetch
      await notificationService.checkSystemAlerts(req.user.id);
      const result = await notificationService.getAll(req.user.id, page, limit);
      successResponse(res, result, 'Notifications retrieved', 200);
    } catch (err) { next(err); }
  },

  getUnreadCount: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await notificationService.getUnreadCount(req.user.id);
      successResponse(res, result, 'Unread count retrieved', 200);
    } catch (err) { next(err); }
  },

  markRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await notificationService.markRead(req.user.id, req.params.id);
      successResponse(res, updated, 'Notification marked as read', 200);
    } catch (err) { next(err); }
  },

  markAllRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await notificationService.markAllRead(req.user.id);
      successResponse(res, result, 'All notifications marked as read', 200);
    } catch (err) { next(err); }
  },

  dismiss: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await notificationService.dismiss(req.user.id, req.params.id);
      successResponse(res, result, 'Notification dismissed', 200);
    } catch (err) { next(err); }
  }
};