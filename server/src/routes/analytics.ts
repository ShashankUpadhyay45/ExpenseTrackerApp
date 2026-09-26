import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/monthly', analyticsController.getMonthlySummary);
router.get('/income-vs-expenses', analyticsController.getIncomeVsExpenses);
router.get('/category-trends', analyticsController.getCategoryTrends);
router.get('/merchant-trends', analyticsController.getMerchantTrends);
router.get('/spending-by-day', analyticsController.getSpendingByDayOfWeek);
router.get('/cash-flow', analyticsController.getCashFlowTrend);
router.get('/compare', analyticsController.getPeriodComparison);
router.get('/largest', analyticsController.getLargestTransactions);

export default router;