import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { Bill } from '../models/Bill.js';
import { Goal } from '../models/Goal.js';
import { config } from '../config/index.js';
import mongoose from 'mongoose';

interface AIContext {
  transactions: any[];
  budgets: any[];
  bills: any[];
  goals: any[];
  summary: any;
}

async function buildUserContext(userId: string, daysBack: number = 90): Promise<AIContext> {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - daysBack);
  
  const [transactions, budgets, bills, goals] = await Promise.all([
    Transaction.find({ userId, date: { $gte: dateFrom } }).sort({ date: -1 }).limit(100).lean(),
    Budget.find({ userId, isActive: true }).lean(),
    Bill.find({ userId, isActive: true }).lean(),
    Goal.find({ userId, status: 'active' }).lean(),
  ]);
  
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const categoryTotals: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });
  
  return {
    transactions: transactions.map(t => ({
      date: t.date, type: t.type, amount: t.amount, category: t.category, merchant: t.merchant,
      description: t.description
    })),
    budgets: budgets.map(b => ({ category: b.category, limit: b.amount, spent: b.spent })),
    bills: bills.map(b => ({ name: b.name, amount: b.amount, nextDue: b.nextDueDate, isPaid: b.isPaid })),
    goals: goals.map(g => ({ name: g.name, target: g.targetAmount, current: g.currentAmount, targetDate: g.targetDate })),
    summary: {
      income,
      expenses,
      savings: income - expenses,
      savingsRate: income > 0 ? ((income - expenses) / income * 100).toFixed(1) : '0',
      categoryTotals,
      transactionCount: transactions.length,
      periodDays: daysBack
    }
  };
}

async function callAIProvider(prompt: string, contextJson: string): Promise<string> {
  if (!config.AI_API_KEY) {
    return generateSmartHeuristicResponse(prompt, JSON.parse(contextJson));
  }
  
  const systemPrompt = `You are "Sage", a thoughtful, sharp, and transparent AI financial advisor in SpendSage.
Use the supplied financial context to give direct, encouraging, numerical answers.
Always clearly state which user figures or metrics you base your advice on. Never claim certainty about future investments.
Financial Data Context:
${contextJson}`;

  try {
    const provider = config.AI_PROVIDER || 'gemini';
    let response: string = '';

    if (provider === 'gemini') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.AI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Question: ${prompt}` }] }],
          generationConfig: { maxOutputTokens: 800, temperature: 0.3 }
        })
      });
      const data = await res.json() as any;
      response = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.AI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 800,
          temperature: 0.3
        })
      });
      const data = await res.json() as any;
      response = data.choices?.[0]?.message?.content || '';
    }

    if (!response) {
      return generateSmartHeuristicResponse(prompt, JSON.parse(contextJson));
    }
    return response;
  } catch (error) {
    return generateSmartHeuristicResponse(prompt, JSON.parse(contextJson));
  }
}

function generateSmartHeuristicResponse(prompt: string, context: AIContext): string {
  const q = prompt.toLowerCase();
  const { summary, categoryTotals = {}, budgets, bills, goals } = { ...context, ...context.summary };

  const topCategory = Object.entries(context.summary.categoryTotals || {})
    .sort((a: any, b: any) => b[1] - a[1])[0];

  if (q.includes('where did i spend the most') || q.includes('highest spending')) {
    if (topCategory) {
      return `Based on your recent 90 days of transactions, your highest spending category is **${topCategory[0]}**, totaling **$${Number(topCategory[1]).toFixed(2)}**. This accounts for roughly ${((Number(topCategory[1]) / (context.summary.expenses || 1)) * 100).toFixed(1)}% of all your expenses.`;
    }
    return "You don't have enough categorized expense records yet to determine a top category. Add a few expenses to see this insight!";
  }

  if (q.includes('safe') || q.includes('spend per day') || q.includes('daily')) {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = Math.max(1, daysInMonth - now.getDate());
    const remainingIncome = Math.max(0, context.summary.income - context.summary.expenses);
    const dailyPace = (remainingIncome / remainingDays).toFixed(2);
    return `Looking at this month's cash flow, you have earned **$${context.summary.income.toFixed(2)}** and spent **$${context.summary.expenses.toFixed(2)}**. With ${remainingDays} days remaining, your safe daily discretionary spend to stay positive is **$${dailyPace} per day**.`;
  }

  if (q.includes('bills') || q.includes('coming up') || q.includes('due')) {
    if (context.bills && context.bills.length > 0) {
      const unpaid = context.bills.filter((b: any) => !b.isPaid);
      if (unpaid.length > 0) {
        const list = unpaid.slice(0, 3).map((b: any) => `• **${b.name}**: $${Number(b.amount).toFixed(2)}`).join('\n');
        return `Here are your upcoming scheduled bills:\n${list}\nMake sure to keep sufficient liquidity in your checking account!`;
      }
      return "Great news! All your scheduled bills for this period are already recorded as paid.";
    }
    return "You have no recurring bills set up. You can track recurring subscriptions and utilities in the Bills tab.";
  }

  if (q.includes('summarize') || q.includes('summary') || q.includes('last 30 days')) {
    return `### 30-Day Financial Health Summary
- **Total Inflow:** $${context.summary.income.toFixed(2)}
- **Total Outflow:** $${context.summary.expenses.toFixed(2)}
- **Net Cashflow:** $${context.summary.savings.toFixed(2)}
- **Savings Rate:** ${context.summary.savingsRate}%
- **Top Outflow:** ${topCategory ? `${topCategory[0]} ($${Number(topCategory[1]).toFixed(2)})` : 'None'}

${Number(context.summary.savingsRate) >= 20 ? '🎉 Excellent savings discipline exceeding the 20% benchmark.' : '💡 Try trimming discretionary categories by 5-10% to raise your savings buffer.'}`;
  }

  return `Sage Financial Analysis:\nIn the past 90 days you have logged **${context.summary.transactionCount} transactions** across **${Object.keys(context.summary.categoryTotals || {}).length} categories** with a net savings rate of **${context.summary.savingsRate}%**.\n\nKey Recommendations:\n1. Keep monitoring your top outflow category: **${topCategory ? topCategory[0] : 'General'}**.\n2. Review any upcoming recurring bills to avoid unexpected overdraft fees.`;
}

export const aiService = {
  async generateSpendingSummary(userId: string) {
    const context = await buildUserContext(userId);
    return callAIProvider('Please generate a concise 30-day spending summary and financial health score.', JSON.stringify(context));
  },

  async answerQuery(userId: string, query: string) {
    const context = await buildUserContext(userId);
    return callAIProvider(query, JSON.stringify(context));
  },

  async categorizeSuggestion(description: string, userId: string) {
    const desc = (description || '').toLowerCase();

    // 1. Check user's own past transaction history
    if (desc.length > 2) {
      const match = await Transaction.findOne({
        userId,
        $or: [
          { description: new RegExp(desc.slice(0, 10), 'i') },
          { merchant: new RegExp(desc.slice(0, 10), 'i') }
        ]
      }).sort({ createdAt: -1 });

      if (match) {
        return { category: match.category, subcategory: match.subcategory, confidence: 0.9 };
      }
    }

    // 2. Keyword heuristics
    if (/(uber|ola|lyft|cab|taxi|train|metro|flight|airline|fuel|petrol|diesel|gas)/i.test(desc)) {
      return { category: 'Transport', confidence: 0.85 };
    }
    if (/(grocery|groceries|supermarket|mart|walmart|whole foods|costco|safeway|trader joe|target)/i.test(desc)) {
      return { category: 'Groceries', confidence: 0.85 };
    }
    if (/(coffee|starbucks|cafe|restaurant|dining|food|zomato|swiggy|doordash|ubereats|pizza|burger)/i.test(desc)) {
      return { category: 'Food & Drink', confidence: 0.85 };
    }
    if (/(amazon|ebay|shopping|clothing|zara|h&m|nike|store|mall)/i.test(desc)) {
      return { category: 'Shopping', confidence: 0.8 };
    }
    if (/(netflix|spotify|hulu|disney|cinema|movie|theatre|steam|playstation|game)/i.test(desc)) {
      return { category: 'Entertainment', confidence: 0.85 };
    }
    if (/(rent|landlord|electricity|utility|water bill|power|wifi|broadband|internet|phone bill|verizon|at&t)/i.test(desc)) {
      return { category: 'Bills', confidence: 0.9 };
    }
    if (/(salary|payroll|wage|dividend|bonus|freelance|stipend)/i.test(desc)) {
      return { category: 'Income', confidence: 0.95 };
    }
    if (/(hospital|pharmacy|medicine|doctor|clinic|dental|health|gym|fitness)/i.test(desc)) {
      return { category: 'Health & Medical', confidence: 0.8 };
    }

    return { category: 'Other', confidence: 0.5 };
  },

  async detectAnomalies(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get average spend by category
    const categoryStats = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: 'expense'
        }
      },
      {
        $group: {
          _id: '$category',
          avgAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const statsMap: Record<string, { avg: number; count: number }> = {};
    categoryStats.forEach(s => {
      statsMap[s._id] = { avg: s.avgAmount, count: s.count };
    });

    // Check transactions in the last 30 days that are 2.5x larger than average
    const recentExpenses = await Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: thirtyDaysAgo }
    }).sort({ amount: -1 }).limit(50);

    const anomalies: any[] = [];
    recentExpenses.forEach(t => {
      const stat = statsMap[t.category];
      if (stat && stat.count >= 3 && t.amount > (stat.avg * 2.5) && t.amount > 50) {
        anomalies.push({
          transactionId: t._id,
          description: t.description,
          amount: t.amount,
          category: t.category,
          date: t.date,
          averageForCategory: Math.round(stat.avg * 100) / 100,
          deviationRatio: Math.round((t.amount / stat.avg) * 10) / 10,
          reason: `Transaction amount is ${Math.round((t.amount / stat.avg) * 10) / 10}x higher than your average ${t.category} spend.`
        });
      }
    });

    return anomalies.slice(0, 5);
  },

  async forecast(userId: string, monthsAhead: number = 3) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: sixMonthsAgo }
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
      }
    ]);

    let totalInc = 0, totalExp = 0, monthCount = 1;
    const monthsRecorded = new Set<string>();

    monthlyAgg.forEach(m => {
      monthsRecorded.add(m._id.month);
      if (m._id.type === 'income') totalInc += m.total;
      if (m._id.type === 'expense') totalExp += m.total;
    });

    monthCount = Math.max(1, monthsRecorded.size);
    const avgMonthlyIncome = totalInc / monthCount;
    const avgMonthlyExpense = totalExp / monthCount;
    const projectedMonthlySavings = avgMonthlyIncome - avgMonthlyExpense;

    const projections: any[] = [];
    const now = new Date();

    for (let i = 1; i <= monthsAhead; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const mStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;
      projections.push({
        month: mStr,
        projectedIncome: Math.round(avgMonthlyIncome),
        projectedExpense: Math.round(avgMonthlyExpense),
        projectedSavings: Math.round(projectedMonthlySavings),
        confidence: Math.max(0.6, 0.9 - (i * 0.08))
      });
    }

    return {
      historicalAvgIncome: Math.round(avgMonthlyIncome),
      historicalAvgExpense: Math.round(avgMonthlyExpense),
      projections
    };
  },

  async whatIfAnalysis(userId: string, scenario: { category: string; change: number }) {
    const { category, change } = scenario; // change can be negative (-100 means reduce by 100)
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const catAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          category,
          type: 'expense',
          date: { $gte: ninetyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const past90Spend = catAgg.length > 0 ? catAgg[0].total : 0;
    const currentMonthlyAvg = past90Spend / 3;
    const newMonthlySpend = Math.max(0, currentMonthlyAvg + change);
    const monthlyDifference = currentMonthlyAvg - newMonthlySpend;
    const annualSavingsImpact = monthlyDifference * 12;

    return {
      category,
      currentMonthlySpend: Math.round(currentMonthlyAvg),
      projectedMonthlySpend: Math.round(newMonthlySpend),
      monthlySavingsGain: Math.round(monthlyDifference),
      annualSavingsGain: Math.round(annualSavingsImpact),
      recommendation: monthlyDifference > 0
        ? `Trimming $${Math.abs(change)} from your ${category} budget saves you $${Math.round(annualSavingsImpact)} every year!`
        : `Increasing ${category} by $${Math.abs(change)} will reduce your annual savings capacity by $${Math.round(Math.abs(annualSavingsImpact))}.`
    };
  }
};