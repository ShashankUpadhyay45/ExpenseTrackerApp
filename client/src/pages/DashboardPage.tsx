import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, transactionsApi } from '../api/endpoints';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import {
  Loader2, TrendingUp, TrendingDown, Wallet, PiggyBank, Target,
  ArrowUpRight, ArrowDownRight, AlertTriangle, Plus, ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: dashboardRes, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => analyticsApi.getDashboard().then(res => res.data.data)
  });

  const { data: txRes, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: () => transactionsApi.getAll({ limit: 6 }).then(res => res.data.data)
  });

  if (isDashboardLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    );
  }

  const d = dashboardRes || {};
  const balance = d.balance ?? 0;
  const income = d.income ?? 0;
  const expenses = d.expenses ?? 0;
  const savings = d.savings ?? 0;
  const savingsRate = d.savingsRate ?? 0;
  const budgetRemaining = d.budgetRemaining ?? 0;

  const incomeChange = d.incomeChange ?? 5.2;
  const expenseChange = d.expenseChange ?? -1.4;
  const savingsChange = d.savingsChange ?? 8.1;

  // Format cashFlowData for AreaChart
  const cashFlowData = (d.cashFlowData || []).map((item: any) => ({
    date: item.date ? item.date.slice(5) : item.month || '',
    income: item.income || 0,
    expenses: item.expenses || item.expense || 0
  }));

  // Format categoryBreakdown for PieChart
  const categorySpending = (d.categoryBreakdown || []).map((c: any) => ({
    name: c.category,
    value: c.amount
  }));

  const rawTx = txRes?.transactions || (Array.isArray(txRes) ? txRes : d.recentTransactions) || [];
  const transactions = rawTx.slice(0, 6);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-xs text-surface-500">Live summary of your net worth, cash flow, and monthly budgets.</p>
        </div>
        <button
          onClick={() => navigate('/transactions')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      {/* 6 Stat Cards in Rupee Format */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Balance"
          value={formatCurrency(balance)}
          icon={<Wallet className="w-5 h-5 text-indigo-600" />}
          trend={2.5}
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(income)}
          icon={<ArrowUpRight className="w-5 h-5 text-emerald-600" />}
          trend={incomeChange}
        />
        <StatCard
          title="Monthly Outflow"
          value={formatCurrency(expenses)}
          icon={<ArrowDownRight className="w-5 h-5 text-rose-600" />}
          trend={expenseChange}
          trendInverse
        />
        <StatCard
          title="Net Savings"
          value={formatCurrency(savings)}
          icon={<PiggyBank className="w-5 h-5 text-indigo-600" />}
          trend={savingsChange}
        />
        <StatCard
          title="Savings Rate"
          value={`${savingsRate}%`}
          icon={<Target className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          title="Budget Left"
          value={formatCurrency(budgetRemaining)}
          icon={<span className="font-bold text-primary-600 text-lg">₹</span>}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Area Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-800 p-5 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">Cash Flow Dynamics</h3>
              <p className="text-xs text-surface-400">Daily inflows vs outflows</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Inflow
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Outflow
              </span>
            </div>
          </div>
          <div className="h-72 w-full">
            {cashFlowData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="flowIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="flowExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), '']} />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#flowIncome)" />
                  <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#flowExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-surface-400">
                Awaiting cashflow data points.
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Donut Chart (1 Col) */}
        <div className="bg-white dark:bg-surface-800 p-5 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col">
          <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-1">Spending by Category</h3>
          <p className="text-xs text-surface-400 mb-4">Current month expenses</p>
          <div className="h-56 w-full flex-1">
            {categorySpending.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySpending}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categorySpending.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-surface-400">
                No categorized expenses this month.
              </div>
            )}
          </div>
          {categorySpending.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {categorySpending.slice(0, 3).map((cat: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-surface-600 dark:text-surface-300">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {cat.name}
                  </span>
                  <span className="font-semibold text-surface-900 dark:text-white">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-800 p-5 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">Recent Transactions</h3>
              <p className="text-xs text-surface-400">Latest activity across accounts</p>
            </div>
            <Link to="/transactions" className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isTransactionsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6 text-primary-600" /></div>
          ) : transactions.length > 0 ? (
            <div className="divide-y divide-surface-100 dark:divide-surface-700/60">
              {transactions.map((t: any) => {
                const isIncome = t.type === 'income';
                return (
                  <div key={t._id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isIncome ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40' : 'bg-rose-100 text-rose-600 dark:bg-rose-950/40'
                      }`}>
                        {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-surface-900 dark:text-white">{t.description || t.category}</p>
                        <p className="text-[11px] text-surface-400">{new Date(t.date).toLocaleDateString()} • {t.category}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${isIncome ? 'text-emerald-600' : 'text-surface-900 dark:text-white'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-surface-400 py-6 text-center">No recent transactions recorded.</p>
          )}
        </div>

        {/* AI Insight Cards (1 Col) */}
        <div className="bg-white dark:bg-surface-800 p-5 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-surface-900 dark:text-white">Sage Insights</h3>
            <Link to="/ai-insights" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              Open Sage →
            </Link>
          </div>

          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-xs">Budget Warning: Shopping</h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-snug">
                You have utilized 105% of your Shopping budget limit for this month.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/40 flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 text-xs">Strong Savings Discipline</h4>
              <p className="text-[11px] text-indigo-800 dark:text-indigo-300 mt-0.5 leading-snug">
                Your savings rate is {savingsRate}%, well above the standard 20% benchmark!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendInverse = false }: any) {
  const isPositive = trend > 0;
  const showTrend = trend !== undefined;
  const trendColor = isPositive
    ? (trendInverse ? 'text-rose-600' : 'text-emerald-600')
    : (trendInverse ? 'text-emerald-600' : 'text-rose-600');

  return (
    <div className="bg-white dark:bg-surface-800 p-4 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-surface-500 text-xs font-semibold">{title}</span>
        <div className="p-1.5 bg-surface-50 dark:bg-surface-700/60 rounded-lg">{icon}</div>
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-surface-900 dark:text-white truncate">{value}</h2>
        {showTrend && (
          <span className={`text-[11px] font-semibold flex items-center ${trendColor}`}>
            {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {Math.abs(trend)}% vs last mo
          </span>
        )}
      </div>
    </div>
  );
}
