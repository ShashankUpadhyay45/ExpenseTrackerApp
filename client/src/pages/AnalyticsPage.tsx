import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/endpoints';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { SkeletonCard } from '../components/ui/Skeleton';
import { formatCurrency } from '../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from 'recharts';
import { BarChart3, TrendingUp, Calendar, ShoppingBag, DollarSign } from 'lucide-react';

export default function AnalyticsPage() {
  const [monthsCount, setMonthsCount] = useState(6);

  // Queries
  const { data: incomeExpRes, isLoading: loadingIncomeExp } = useQuery({
    queryKey: ['analytics', 'income-vs-expenses', monthsCount],
    queryFn: () => analyticsApi.getIncomeVsExpenses(monthsCount)
  });

  const { data: dayOfWeekRes, isLoading: loadingDayOfWeek } = useQuery({
    queryKey: ['analytics', 'spending-by-day'],
    queryFn: () => analyticsApi.getSpendingByDayOfWeek()
  });

  const { data: merchantsRes, isLoading: loadingMerchants } = useQuery({
    queryKey: ['analytics', 'merchant-trends'],
    queryFn: () => analyticsApi.getMerchantTrends(8)
  });

  const { data: largestRes, isLoading: loadingLargest } = useQuery({
    queryKey: ['analytics', 'largest'],
    queryFn: () => analyticsApi.getLargestTransactions(8)
  });

  const incomeVsExpenses = incomeExpRes?.data?.data || [];
  const dayOfWeekData = dayOfWeekRes?.data?.data || [];
  const merchantsData = merchantsRes?.data?.data || [];
  const largestTransactions = largestRes?.data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">Financial Analytics</h1>
          <p className="text-sm text-surface-500">Deep-dive into income trends, merchant habits, and weekly spending patterns.</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
          {[3, 6, 12].map(m => (
            <button
              key={m}
              onClick={() => setMonthsCount(m)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                monthsCount === m
                  ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
              }`}
            >
              {m} Months
            </button>
          ))}
        </div>
      </div>

      {/* Main Income vs Expense Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" /> Income vs Expenses ({monthsCount} Months)
              </CardTitle>
              <CardDescription>Monthly comparison of inflows, outflows, and net savings.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingIncomeExp ? (
            <div className="h-72 flex items-center justify-center">Loading chart data...</div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incomeVsExpenses}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid: Day of Week + Top Merchants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Day of Week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-5 h-5 text-indigo-500" /> Spending by Day of Week
            </CardTitle>
            <CardDescription>Discover which days you spend the most money on.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDayOfWeek ? (
              <div className="h-64 flex items-center justify-center">Loading...</div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(d) => d.slice(0, 3)} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Bar dataKey="total" name="Total Spent" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Merchants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="w-5 h-5 text-amber-500" /> Top Spending Merchants
            </CardTitle>
            <CardDescription>Merchants where you have spent the highest total amounts.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMerchants ? (
              <div className="h-64 flex items-center justify-center">Loading...</div>
            ) : merchantsData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-surface-400">No merchant data recorded yet.</div>
            ) : (
              <div className="space-y-3">
                {merchantsData.map((m: any, idx: number) => {
                  const maxAmt = merchantsData[0]?.amount || 1;
                  const pct = Math.round((m.amount / maxAmt) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-surface-800 dark:text-surface-200">{m.merchant} ({m.count} txns)</span>
                        <span className="font-bold text-surface-900 dark:text-white">{formatCurrency(m.amount)}</span>
                      </div>
                      <div className="w-full bg-surface-100 dark:bg-surface-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Largest Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-5 h-5 text-rose-500" /> Largest Individual Outflows
          </CardTitle>
          <CardDescription>Top single transactions that had the greatest impact on your balance.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLargest ? (
            <div>Loading...</div>
          ) : largestTransactions.length === 0 ? (
            <div className="text-sm text-surface-400">No expense records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-800 text-xs font-semibold text-surface-400 uppercase">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Merchant</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800/60">
                  {largestTransactions.map((tx: any) => (
                    <tr key={tx._id} className="hover:bg-surface-50 dark:hover:bg-surface-800/40">
                      <td className="py-2.5 text-xs text-surface-500">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="py-2.5 font-medium text-surface-900 dark:text-white">{tx.description}</td>
                      <td className="py-2.5 text-xs text-surface-500">{tx.category}</td>
                      <td className="py-2.5 text-xs text-surface-500">{tx.merchant || '-'}</td>
                      <td className="py-2.5 text-right font-bold text-rose-600 dark:text-rose-400">{formatCurrency(tx.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
