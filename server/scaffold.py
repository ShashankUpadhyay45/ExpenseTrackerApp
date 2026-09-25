import os

base_dir = r"c:\Users\ASUS\Desktop\Projects\SpendSage\server\src"

files_to_create = {
    # Validators
    r"validators\budget.ts": """import { z } from 'zod';
export const createBudgetSchema = z.object({ body: z.object({ category: z.string(), amount: z.number().positive(), period: z.enum(['monthly', 'weekly', 'yearly', 'custom']), startDate: z.string(), endDate: z.string() }) });
export const updateBudgetSchema = z.object({ params: z.object({ id: z.string() }), body: createBudgetSchema.shape.body.partial() });""",

    r"validators\bill.ts": """import { z } from 'zod';
export const createBillSchema = z.object({ body: z.object({ name: z.string(), amount: z.number().positive(), category: z.string(), frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly', 'custom']), dueDate: z.string(), nextDueDate: z.string() }) });
export const updateBillSchema = z.object({ params: z.object({ id: z.string() }), body: createBillSchema.shape.body.partial() });
export const recordPaymentSchema = z.object({ params: z.object({ id: z.string() }), body: z.object({ amount: z.number().positive(), date: z.string() }) });""",

    r"validators\goal.ts": """import { z } from 'zod';
export const createGoalSchema = z.object({ body: z.object({ name: z.string(), targetAmount: z.number().positive(), targetDate: z.string() }) });
export const updateGoalSchema = z.object({ params: z.object({ id: z.string() }), body: createGoalSchema.shape.body.partial() });
export const addContributionSchema = z.object({ params: z.object({ id: z.string() }), body: z.object({ amount: z.number().positive(), date: z.string().optional(), note: z.string().optional() }) });""",

    r"validators\account.ts": """import { z } from 'zod';
export const createAccountSchema = z.object({ body: z.object({ name: z.string(), type: z.enum(['cash', 'bank', 'wallet', 'debit', 'credit', 'savings']), balance: z.number().optional() }) });
export const updateAccountSchema = z.object({ params: z.object({ id: z.string() }), body: createAccountSchema.shape.body.partial() });
export const transferSchema = z.object({ body: z.object({ fromAccountId: z.string(), toAccountId: z.string(), amount: z.number().positive(), date: z.string() }) });""",

    r"validators\common.ts": """import { z } from 'zod';
export const paginationSchema = z.object({ query: z.object({ page: z.string().optional(), limit: z.string().optional() }) });
export const dateRangeSchema = z.object({ query: z.object({ startDate: z.string(), endDate: z.string() }) });
export const mongoIdSchema = z.object({ params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') }) });""",

    # Services
    r"services\authService.ts": """export const authService = {
  register: async (data: any) => { return { user: { id: '1', ...data }, token: 'token' }; },
  login: async (data: any) => { return { user: { id: '1', email: data.email }, token: 'token' }; }
};""",

    r"services\transactionService.ts": """import { Transaction } from '../models/Transaction.js';
export const transactionService = {
  create: async (data: any) => await Transaction.create(data),
  getAll: async (query: any) => await Transaction.find(query),
  getById: async (id: string) => await Transaction.findById(id),
  update: async (id: string, data: any) => await Transaction.findByIdAndUpdate(id, data, { new: true }),
  delete: async (id: string) => await Transaction.findByIdAndDelete(id)
};""",

    r"services\budgetService.ts": """import { Budget } from '../models/Budget.js';
export const budgetService = {
  create: async (data: any) => await Budget.create(data),
  getAll: async (query: any) => await Budget.find(query),
  getById: async (id: string) => await Budget.findById(id),
  update: async (id: string, data: any) => await Budget.findByIdAndUpdate(id, data, { new: true }),
  delete: async (id: string) => await Budget.findByIdAndDelete(id)
};""",

    r"services\billService.ts": """import { Bill } from '../models/Bill.js';
export const billService = {
  create: async (data: any) => await Bill.create(data),
  getAll: async (query: any) => await Bill.find(query),
  getById: async (id: string) => await Bill.findById(id),
  update: async (id: string, data: any) => await Bill.findByIdAndUpdate(id, data, { new: true }),
  delete: async (id: string) => await Bill.findByIdAndDelete(id)
};""",

    r"services\goalService.ts": """import { Goal } from '../models/Goal.js';
export const goalService = {
  create: async (data: any) => await Goal.create(data),
  getAll: async (query: any) => await Goal.find(query),
  getById: async (id: string) => await Goal.findById(id),
  update: async (id: string, data: any) => await Goal.findByIdAndUpdate(id, data, { new: true }),
  delete: async (id: string) => await Goal.findByIdAndDelete(id)
};""",

    r"services\accountService.ts": """import { Account } from '../models/Account.js';
export const accountService = {
  create: async (data: any) => await Account.create(data),
  getAll: async (query: any) => await Account.find(query),
  getById: async (id: string) => await Account.findById(id),
  update: async (id: string, data: any) => await Account.findByIdAndUpdate(id, data, { new: true }),
  delete: async (id: string) => await Account.findByIdAndDelete(id)
};""",

    r"services\analyticsService.ts": """export const analyticsService = {
  getMonthlySummary: async (userId: string, month: string) => { return { income: 5000, expenses: 3000 }; }
};""",

    r"services\aiService.ts": """export const aiService = {
  generateSpendingSummary: async (userId: string) => { return "AI Summary of spending"; }
};""",

    r"services\notificationService.ts": """import { Notification } from '../models/Notification.js';
export const notificationService = {
  create: async (data: any) => await Notification.create(data),
  getAll: async (userId: string) => await Notification.find({ userId })
};""",

    r"services\receiptService.ts": """export const receiptService = {
  processReceipt: async (userId: string, file: any) => { return { status: 'processed' }; }
};""",

    r"services\importService.ts": """export const importService = {
  processCSV: async (userId: string, file: any) => { return { status: 'imported', rows: 100 }; }
};""",

    r"services\reportService.ts": """export const reportService = {
  generateMonthlyReport: async (userId: string, month: string) => { return { url: '/reports/monthly.pdf' }; }
};""",

    # Controllers
    r"controllers\authController.ts": """import { Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { successResponse } from '../utils/apiResponse.js';

export const register = async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  successResponse(res, result, 'User registered successfully');
};
export const login = async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  successResponse(res, result, 'User logged in successfully');
};""",

    r"controllers\transactionController.ts": """import { Request, Response } from 'express';
import { transactionService } from '../services/transactionService.js';
import { successResponse } from '../utils/apiResponse.js';

export const createTransaction = async (req: Request, res: Response) => {
  const result = await transactionService.create({ ...req.body, userId: req.user.id });
  successResponse(res, result, 'Transaction created successfully');
};
export const getTransactions = async (req: Request, res: Response) => {
  const result = await transactionService.getAll({ userId: req.user.id });
  successResponse(res, result, 'Transactions fetched successfully');
};""",

    # Add placeholders for other controllers for brevity...
    r"controllers\budgetController.ts": "export const getBudgets = async (req, res) => res.send('Budgets');",
    r"controllers\billController.ts": "export const getBills = async (req, res) => res.send('Bills');",
    r"controllers\goalController.ts": "export const getGoals = async (req, res) => res.send('Goals');",
    r"controllers\accountController.ts": "export const getAccounts = async (req, res) => res.send('Accounts');",
    r"controllers\analyticsController.ts": "export const getAnalytics = async (req, res) => res.send('Analytics');",
    r"controllers\notificationController.ts": "export const getNotifications = async (req, res) => res.send('Notifications');",
    r"controllers\receiptController.ts": "export const getReceipts = async (req, res) => res.send('Receipts');",
    r"controllers\importController.ts": "export const getImports = async (req, res) => res.send('Imports');",
    r"controllers\reportController.ts": "export const getReports = async (req, res) => res.send('Reports');",
    r"controllers\aiController.ts": "export const getInsights = async (req, res) => res.send('Insights');",
    
    # Routes
    r"routes\budget.ts": "import { Router } from 'express'; const router = Router(); export default router;",
    r"routes\bill.ts": "import { Router } from 'express'; const router = Router(); export default router;",
    r"routes\goal.ts": "import { Router } from 'express'; const router = Router(); export default router;",
    r"routes\analytics.ts": "import { Router } from 'express'; const router = Router(); export default router;",
    r"routes\notification.ts": "import { Router } from 'express'; const router = Router(); export default router;",
    r"routes\receipt.ts": "import { Router } from 'express'; const router = Router(); export default router;",
    r"routes\import.ts": "import { Router } from 'express'; const router = Router(); export default router;",
    r"routes\report.ts": "import { Router } from 'express'; const router = Router(); export default router;",
    r"routes\ai.ts": "import { Router } from 'express'; const router = Router(); export default router;",
    r"routes\search.ts": "import { Router } from 'express'; const router = Router(); export default router;",
    r"routes\index.ts": """import { Router } from 'express';
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

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
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

export default router;"""
}

for rel_path, content in files_to_create.items():
    full_path = os.path.join(base_dir, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip())

print("Scaffolding complete.")
