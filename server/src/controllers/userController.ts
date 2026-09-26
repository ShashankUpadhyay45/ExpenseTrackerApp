import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { UserPreference } from '../models/UserPreference.js';
import { Transaction } from '../models/Transaction.js';
import { Account } from '../models/Account.js';
import { Budget } from '../models/Budget.js';
import { Bill } from '../models/Bill.js';
import { Goal } from '../models/Goal.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';

export const userController = {
  getProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.user.id).select('-refreshTokens');
      if (!user) throw new AppError('User not found', 404);
      successResponse(res, user, 'Profile retrieved', 200);
    } catch (err) { next(err); }
  },

  updateProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { firstName, lastName, avatar } = req.body;
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: { firstName, lastName, avatar } },
        { new: true, runValidators: true }
      ).select('-refreshTokens');
      successResponse(res, user, 'Profile updated successfully', 200);
    } catch (err) { next(err); }
  },

  getPreferences: async (req: Request, res: Response, next: NextFunction) => {
    try {
      let pref = await UserPreference.findOne({ userId: req.user.id });
      if (!pref) {
        pref = await UserPreference.create({ userId: req.user.id });
      }
      successResponse(res, pref, 'Preferences retrieved', 200);
    } catch (err) { next(err); }
  },

  updatePreferences: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pref = await UserPreference.findOneAndUpdate(
        { userId: req.user.id },
        { $set: req.body },
        { new: true, upsert: true }
      );
      successResponse(res, pref, 'Preferences updated successfully', 200);
    } catch (err) { next(err); }
  },

  deleteAccount: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      // Cascade delete user-owned data
      await Promise.all([
        Transaction.deleteMany({ userId }),
        Account.deleteMany({ userId }),
        Budget.deleteMany({ userId }),
        Bill.deleteMany({ userId }),
        Goal.deleteMany({ userId }),
        UserPreference.deleteOne({ userId }),
        User.deleteOne({ _id: userId })
      ]);
      successResponse(res, null, 'Account and all associated financial data permanently deleted', 200);
    } catch (err) { next(err); }
  }
};
