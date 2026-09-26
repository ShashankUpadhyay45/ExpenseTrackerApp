import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { successResponse } from '../utils/apiResponse.js';

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      successResponse(res, result, 'User registered successfully', 201);
    } catch (err) { next(err); }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      successResponse(res, result, 'Logged in successfully', 200);
    } catch (err) { next(err); }
  },

  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.body.refreshToken;
      await authService.logout(req.user.id, refreshToken);
      successResponse(res, null, 'Logged out successfully', 200);
    } catch (err) { next(err); }
  },

  refreshToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.refreshToken(req.body.refreshToken);
      successResponse(res, result, 'Token refreshed successfully', 200);
    } catch (err) { next(err); }
  },

  changePassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
      successResponse(res, null, 'Password changed successfully', 200);
    } catch (err) { next(err); }
  },

  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // In production would send email; here we acknowledge securely
      successResponse(res, { email: req.body.email }, 'If that email is registered, password reset instructions have been sent.', 200);
    } catch (err) { next(err); }
  }
};