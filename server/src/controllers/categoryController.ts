import { Request, Response, NextFunction } from 'express';
import { Category } from '../models/Category.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';

export const categoryController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await Category.find({ userId: req.user.id, isActive: true }).sort({ sortOrder: 1, name: 1 });
      successResponse(res, categories, 'Categories retrieved', 200);
    } catch (err) { next(err); }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = await Category.create({ ...req.body, userId: req.user.id });
      successResponse(res, category, 'Category created successfully', 201);
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await Category.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        { $set: req.body },
        { new: true }
      );
      if (!updated) throw new AppError('Category not found', 404);
      successResponse(res, updated, 'Category updated successfully', 200);
    } catch (err) { next(err); }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await Category.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
      if (!deleted) throw new AppError('Category not found', 404);
      successResponse(res, null, 'Category deleted successfully', 200);
    } catch (err) { next(err); }
  }
};
