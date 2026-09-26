import { Transaction } from '../models/Transaction.js';
import { Account } from '../models/Account.js';
import { Budget } from '../models/Budget.js';
import { Bill } from '../models/Bill.js';
import mongoose from 'mongoose';

export const analyticsService = {
  getDashboard: async (userId: string) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    
    // Current month boundaries
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Prior month boundaries (for period-over-period comparison)
    const priorMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const priorMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // 1. Calculate Net Worth from active Accounts
    const accounts = await Account.find({ userId, isActive: true });
    let netWorth = 0;
    accounts.forEach(acc => {
      if (acc.type === 'credit') {
        netWorth -= acc.balance;
      } else {
        netWorth += acc.balance;
      }
    });

    // 2. Current Month Income and Expenses
    const currentMonthAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: currentMonthStart, $lte: currentMonthEnd },
          type: { $in: ['income', 'expense'] }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    let income = 0;
    let expenses = 0;
    currentMonthAgg.forEach(item => {
      if (item._id === 'income') income = item.total;
      if (item._id === 'expense') expenses = item.total;
    });

    const savings = income - expenses;
    const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expenses) / income) * 100)) : 0;

    // 3. Prior Month for Changes
    const priorMonthAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: priorMonthStart, $lte: priorMonthEnd },
          type: { $in: ['income', 'expense'] }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    let priorIncome = 0;
    let priorExpenses = 0;
    priorMonthAgg.forEach(item => {
      if (item._id === 'income') priorIncome = item.total;
      if (item._id === 'expense') priorExpenses = item.total;
    });

    const incomeChange = priorIncome > 0 ? Math.round(((income - priorIncome) / priorIncome) * 100) : 0;
    const expenseChange = priorExpenses > 0 ? Math.round(((expenses - priorExpenses) / priorExpenses) * 100) : 0;
    const priorSavings = priorIncome - priorExpenses;
    const savingsChange = priorSavings !== 0 ? Math.round(((savings - priorSavings) / Math.abs(priorSavings)) * 100) : 0;

    // 4. Category Spending Breakdown for current month
    const categoryAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: 'expense',
          date: { $gte: currentMonthStart, $lte: currentMonthEnd }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const categoryBreakdown = categoryAgg.map(cat => ({
      category: cat._id,
      amount: cat.total,
      percentage: expenses > 0 ? Math.round((cat.total / expenses) * 100) : 0
    }));

    // 5. Total Budget Remaining
    const budgets = await Budget.find({ userId, isActive: true });
    let totalBudgetLimit = 0;
    budgets.forEach(b => { totalBudgetLimit += b.amount; });
    const budgetRemaining = Math.max(0, totalBudgetLimit - expenses);

    // 6. Cash Flow Trend (Last 30 Days daily data)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const cashFlowAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: thirtyDaysAgo, $lte: now },
          type: { $in: ['income', 'expense'] }
        }
      },
      {
        $group: {
          _id: {
            dateStr: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      }
    ]);

    const cashFlowMap: Record<string, { date: string; income: number; expenses: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().slice(0, 10);
      cashFlowMap[str] = { date: str, income: 0, expenses: 0 };
    }

    cashFlowAgg.forEach(item => {
      const dateStr = item._id.dateStr;
      if (cashFlowMap[dateStr]) {
        if (item._id.type === 'income') cashFlowMap[dateStr].income = item.total;
        if (item._id.type === 'expense') cashFlowMap[dateStr].expenses = item.total;
      }
    });

    const cashFlowData = Object.values(cashFlowMap);

    // 7. Recent Transactions
    const recentTransactions = await Transaction.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(6);

    // 8. Upcoming Bills (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingBills = await Bill.find({
      userId,
      isActive: true,
      nextDueDate: { $gte: now, $lte: nextWeek }
    }).limit(3);

    return {
      balance: netWorth,
      income,
      expenses,
      savings,
      savingsRate,
      budgetRemaining,
      totalBudgetLimit,
      incomeChange,
      expenseChange,
      savingsChange,
      categoryBreakdown,
      cashFlowData,
      recentTransactions,
      upcomingBills,
      topCategory: categoryBreakdown.length > 0 ? categoryBreakdown[0] : null
    };
  },

  getMonthlySummary: async (userId: string, monthStr?: string) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const targetDate = monthStr ? new Date(`${monthStr}-01`) : new Date();
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

    const agg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    let income = 0, expenses = 0, transfer = 0;
    agg.forEach(a => {
      if (a._id === 'income') income = a.total;
      if (a._id === 'expense') expenses = a.total;
      if (a._id === 'transfer') transfer = a.total;
    });

    return {
      month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      income,
      expenses,
      savings: income - expenses,
      savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
      transfer
    };
  },

  getIncomeVsExpenses: async (userId: string, monthsCount: number = 6) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsCount + 1, 1);

    const agg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: startDate },
          type: { $in: ['income', 'expense'] }
        }
      },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$date' } },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    const resultMonths: Record<string, { month: string; income: number; expenses: number; savings: number }> = {};
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      resultMonths[mStr] = { month: mStr, income: 0, expenses: 0, savings: 0 };
    }

    agg.forEach(item => {
      const m = item._id.month;
      if (resultMonths[m]) {
        if (item._id.type === 'income') resultMonths[m].income = item.total;
        if (item._id.type === 'expense') resultMonths[m].expenses = item.total;
      }
    });

    Object.values(resultMonths).forEach(r => {
      r.savings = r.income - r.expenses;
    });

    return Object.values(resultMonths);
  },

  getCategoryTrends: async (userId: string, monthsCount: number = 6) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsCount + 1, 1);

    const agg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: 'expense',
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$date' } },
            category: '$category'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    const monthsSet = new Set<string>();
    const categoryTotals: Record<string, Record<string, number>> = {};

    agg.forEach(item => {
      const { month, category } = item._id;
      monthsSet.add(month);
      if (!categoryTotals[category]) categoryTotals[category] = {};
      categoryTotals[category][month] = item.total;
    });

    return {
      months: Array.from(monthsSet).sort(),
      categories: categoryTotals
    };
  },

  getMerchantTrends: async (userId: string, limit: number = 10) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const agg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: 'expense',
          merchant: { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$merchant',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: limit }
    ]);

    return agg.map(m => ({
      merchant: m._id,
      amount: m.total,
      count: m.count
    }));
  },

  getSpendingByDayOfWeek: async (userId: string) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const agg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: 'expense'
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$date' }, // 1 (Sun) to 7 (Sat)
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const output = daysMap.map((dayName, idx) => {
      const match = agg.find(a => a._id === (idx + 1));
      return {
        day: dayName,
        total: match ? match.total : 0,
        count: match ? match.count : 0
      };
    });

    return output;
  },

  getLargestTransactions: async (userId: string, limit: number = 10) => {
    return await Transaction.find({ userId, type: 'expense' })
      .sort({ amount: -1 })
      .limit(limit);
  },

  getCashFlowTrend: async (userId: string, months: number = 6) => {
    return analyticsService.getIncomeVsExpenses(userId, months);
  },

  getPeriodComparison: async (userId: string, p1Start: string, p1End: string, p2Start: string, p2End: string) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const calcPeriod = async (start: Date, end: Date) => {
      const agg = await Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            date: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' }
          }
        }
      ]);
      let income = 0, expenses = 0;
      agg.forEach(a => {
        if (a._id === 'income') income = a.total;
        if (a._id === 'expense') expenses = a.total;
      });
      return { income, expenses, savings: income - expenses };
    };

    const period1 = await calcPeriod(new Date(p1Start), new Date(p1End));
    const period2 = await calcPeriod(new Date(p2Start), new Date(p2End));

    return {
      period1,
      period2,
      incomeDiff: period1.income - period2.income,
      expenseDiff: period1.expenses - period2.expenses,
      savingsDiff: period1.savings - period2.savings
    };
  }
};