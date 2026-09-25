import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DollarSign, TrendingUp, TrendingDown, Target, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const stats = [
  { title: 'Total Balance', value: '$24,562.00', icon: Wallet, trend: '+2.5%', isPositive: true },
  { title: 'Total Income', value: '$8,240.50', icon: TrendingUp, trend: '+12.5%', isPositive: true },
  { title: 'Total Expenses', value: '$4,120.20', icon: TrendingDown, trend: '-4.2%', isPositive: true },
  { title: 'Total Savings', value: '$4,120.30', icon: DollarSign, trend: '+18.1%', isPositive: true },
  { title: 'Savings Rate', value: '50.0%', icon: Target, trend: '+4.1%', isPositive: true },
  { title: 'Budget Remaining', value: '$1,879.80', icon: Target, trend: '-2.1%', isPositive: false },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-surface-500">Here's your financial overview for this month.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-surface-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-surface-500 flex items-center mt-1">
                <span className={`flex items-center ${stat.isPositive ? 'text-success-500' : 'text-danger-500'} mr-1`}>
                  {stat.isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {stat.trend}
                </span>
                from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full flex items-center justify-center text-surface-400 bg-surface-50 dark:bg-surface-900 rounded-md">
              [Recharts Area Chart Component Here]
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center text-surface-400 bg-surface-50 dark:bg-surface-900 rounded-md">
              [Recharts Donut Chart Component Here]
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
