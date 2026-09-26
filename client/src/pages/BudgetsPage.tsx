import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { budgetsApi } from '../api/endpoints';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Plus, Target, Calendar, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function BudgetsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: budgetsResponse, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetsApi.getAll().then(res => res.data)
  });

  const budgets = budgetsResponse?.data || [];

  const totalBudget = budgets.reduce((acc: number, b: any) => acc + b.amount, 0);
  const totalSpent = budgets.reduce((acc: number, b: any) => acc + (b.spent || 0), 0);
  const remaining = totalBudget - totalSpent;
  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6 p-6 min-h-screen text-slate-900 dark:text-slate-100 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
        >
          <Plus size={16} className="mr-2" /> Add Budget
        </button>
      </div>

      {/* Summary Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <h2 className="text-lg font-semibold mb-4">Monthly Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div>
            <p className="text-sm text-slate-500">Total Budget</p>
            <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Spent</p>
            <p className="text-2xl font-bold text-rose-600">{formatCurrency(totalSpent)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Remaining</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(remaining)}</p>
          </div>
        </div>
        <ProgressBar progress={overallProgress} showValue={false} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="bg-slate-100 dark:bg-slate-800 h-48 rounded-xl animate-pulse" />)}
        </div>
      ) : budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget: any) => {
            const spent = budget.spent || 0;
            const progress = (spent / budget.amount) * 100;
            return (
              <div key={budget._id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{budget.category}</h3>
                    <p className="text-xs text-slate-500 capitalize flex items-center mt-1">
                      <Calendar size={12} className="mr-1" /> {budget.period}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(spent)}</p>
                    <p className="text-xs text-slate-500">of {formatCurrency(budget.amount)}</p>
                  </div>
                </div>
                
                <ProgressBar progress={progress} valueText={`${Math.round(progress)}%`} />
                
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Remaining</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(budget.amount - spent)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="No budgets set"
          description="Create budgets for your spending categories to track where your money goes."
          action={{ label: 'Create Budget', onClick: () => setIsAddOpen(true) }}
        />
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Budget">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Budget form placeholder. Real implementation with React Hook Form + Zod goes here.</p>
        </div>
      </Modal>
    </div>
  );
}
