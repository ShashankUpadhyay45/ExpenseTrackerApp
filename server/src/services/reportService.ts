import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { Goal } from '../models/Goal.js';
import { Bill } from '../models/Bill.js';
import { Account } from '../models/Account.js';
import { stringify } from 'csv-stringify/sync';
import PDFDocument from 'pdfkit';

export const reportService = {
  generateReportData: async (userId: string, options: { type?: string; startDate?: string; endDate?: string }) => {
    const now = new Date();
    const startDate = options.startDate ? new Date(options.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = options.endDate ? new Date(options.endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [transactions, budgets, goals, bills, accounts] = await Promise.all([
      Transaction.find({ userId, date: { $gte: startDate, $lte: endDate } }).sort({ date: -1 }),
      Budget.find({ userId, isActive: true }),
      Goal.find({ userId }),
      Bill.find({ userId, isActive: true }),
      Account.find({ userId, isActive: true })
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      if (t.type === 'expense') {
        totalExpenses += t.amount;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    const topCategories = Object.entries(categoryTotals)
      .map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        percentage: totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      period: {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10)
      },
      summary: {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        transactionCount: transactions.length
      },
      topCategories,
      budgets: budgets.map(b => ({ category: b.category, limit: b.amount, spent: b.spent })),
      goals: goals.map(g => ({ name: g.name, target: g.targetAmount, current: g.currentAmount, status: g.status })),
      bills: bills.map(b => ({ name: b.name, amount: b.amount, nextDue: b.nextDueDate, isPaid: b.isPaid })),
      accounts: accounts.map(a => ({ name: a.name, type: a.type, balance: a.balance }))
    };
  },

  exportCSV: async (userId: string, startDate?: string, endDate?: string) => {
    const query: any = { userId };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });

    const rows = transactions.map(t => [
      t.date.toISOString().slice(0, 10),
      t.type,
      t.category,
      t.description || '',
      t.merchant || '',
      t.amount.toFixed(2),
      t.tags ? t.tags.join(';') : ''
    ]);

    const csvOutput = stringify([
      ['Date', 'Type', 'Category', 'Description', 'Merchant', 'Amount', 'Tags'],
      ...rows
    ]);

    return csvOutput;
  },

  exportJSON: async (userId: string) => {
    const [transactions, budgets, goals, bills, accounts] = await Promise.all([
      Transaction.find({ userId }),
      Budget.find({ userId }),
      Goal.find({ userId }),
      Bill.find({ userId }),
      Account.find({ userId })
    ]);

    return {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {
        accounts,
        transactions,
        budgets,
        goals,
        bills
      }
    };
  },

  generatePDFStream: async (userId: string, startDate?: string, endDate?: string) => {
    const reportData = await reportService.generateReportData(userId, { startDate, endDate });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Header
    doc.fillColor('#4F46E5').fontSize(24).text('✦ SpendSage Financial Report', { align: 'left' });
    doc.fillColor('#6B7280').fontSize(10).text(`Generated: ${new Date().toLocaleDateString()} | Period: ${reportData.period.startDate} to ${reportData.period.endDate}`, { align: 'left' });
    doc.moveDown(1.5);

    // Summary Box
    doc.fillColor('#111827').fontSize(16).text('Executive Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#374151');
    doc.text(`Total Income:   $${reportData.summary.totalIncome.toFixed(2)}`);
    doc.text(`Total Expenses: $${reportData.summary.totalExpenses.toFixed(2)}`);
    doc.text(`Net Savings:    $${reportData.summary.netSavings.toFixed(2)} (${reportData.summary.savingsRate}% Savings Rate)`);
    doc.text(`Total Transactions Logged: ${reportData.summary.transactionCount}`);
    doc.moveDown(1.5);

    // Top Categories
    doc.fillColor('#111827').fontSize(14).text('Top Spending Categories', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#374151');
    reportData.topCategories.slice(0, 8).forEach(c => {
      doc.text(`• ${c.category}: $${c.amount.toFixed(2)} (${c.percentage}%)`);
    });
    doc.moveDown(1.5);

    // Budgets
    if (reportData.budgets.length > 0) {
      doc.fillColor('#111827').fontSize(14).text('Budget Performance', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#374151');
      reportData.budgets.forEach(b => {
        doc.text(`• ${b.category}: $${b.spent.toFixed(2)} spent of $${b.limit.toFixed(2)} budget`);
      });
      doc.moveDown(1.5);
    }

    // Footer note
    doc.fillColor('#9CA3AF').fontSize(8).text('SpendSage • Confidential Financial Statement • Empowering Smarter Financial Decisions', 40, doc.page.height - 50, { align: 'center' });

    doc.end();
    return doc;
  }
};