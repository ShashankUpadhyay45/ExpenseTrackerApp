import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './user.js';
import accountRoutes from './account.js';
import transactionRoutes from './transaction.js';
import budgetRoutes from './budget.js';
import billRoutes from './bill.js';
import goalRoutes from './goal.js';
import analyticsRoutes from './analytics.js';
import notificationRoutes from './notification.js';
import receiptRoutes from './receipt.js';
import importRoutes from './import.js';
import reportRoutes from './report.js';
import aiRoutes from './ai.js';
import searchRoutes from './search.js';
import categoryRoutes from './category.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/categories', categoryRoutes);
router.use('/budgets', budgetRoutes);
router.use('/bills', billRoutes);
router.use('/goals', goalRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/receipts', receiptRoutes);
router.use('/imports', importRoutes);
router.use('/reports', reportRoutes);
router.use('/ai', aiRoutes);
router.use('/search', searchRoutes);

export default router;