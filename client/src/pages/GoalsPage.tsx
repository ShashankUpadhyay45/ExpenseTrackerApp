import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApi, accountsApi } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { formatCurrency } from '../utils/formatters';
import { Target, Trophy, Plus, Trash2, Calendar, Coins, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [contributingGoal, setContributingGoal] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    priority: 'medium'
  });

  const [contributionData, setContributionData] = useState({
    amount: 0,
    note: '',
    accountId: ''
  });

  // Queries
  const { data: goalsRes, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.getAll()
  });

  const { data: accountsRes } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAll()
  });

  const goals = goalsRes?.data?.data || [];
  const accounts = accountsRes?.data?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => goalsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsAddOpen(false);
      setFormData({ name: '', targetAmount: 0, currentAmount: 0, targetDate: new Date().toISOString().slice(0, 10), priority: 'medium' });
      toast.success('Savings goal created!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create goal')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => goalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete goal')
  });

  const contributeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => goalsApi.addContribution(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setContributingGoal(null);
      setContributionData({ amount: 0, note: '', accountId: '' });
      toast.success('Contribution recorded successfully!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add contribution')
  });

  const activeGoals = goals.filter((g: any) => g.status !== 'completed');
  const completedGoals = goals.filter((g: any) => g.status === 'completed');

  const totalSavedInGoals = goals.reduce((sum: number, g: any) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum: number, g: any) => sum + g.targetAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">Savings Goals</h1>
          <p className="text-sm text-surface-500">Track and fund milestones like Emergency Funds, Vacation, or Down Payment.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Create Goal
        </Button>
      </div>

      {/* Progress Overview Card */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-surface-900 border-emerald-200 dark:border-emerald-900/40">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total Goals Progress</span>
              <h2 className="text-3xl font-extrabold text-emerald-950 dark:text-emerald-100 mt-1">
                {formatCurrency(totalSavedInGoals)} <span className="text-lg font-normal text-surface-500">/ {formatCurrency(totalTarget)}</span>
              </h2>
            </div>
            <div className="text-left md:text-right">
              <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {totalTarget > 0 ? Math.round((totalSavedInGoals / totalTarget) * 100) : 0}% Target Reached
              </span>
              <p className="text-xs text-surface-500 mt-0.5">{activeGoals.length} active goals in progress</p>
            </div>
          </div>
          <div className="w-full bg-emerald-200 dark:bg-emerald-900/50 h-2.5 rounded-full overflow-hidden mt-4">
            <div
              className="h-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-500"
              style={{ width: `${totalTarget > 0 ? Math.min(100, (totalSavedInGoals / totalTarget) * 100) : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : activeGoals.length === 0 && completedGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals set yet"
          description="Setting clear financial targets helps you save faster and keep spending disciplined."
          actionLabel="Create Goal"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {activeGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-3">Active Goals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeGoals.map((goal: any) => (
                  <Card key={goal._id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400">
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">{goal.name}</CardTitle>
                          <span className="text-xs text-surface-500">Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={goal.priority === 'high' ? 'danger' : goal.priority === 'medium' ? 'warning' : 'default'} className="capitalize text-[10px]">
                          {goal.priority}
                        </Badge>
                        <button
                          onClick={() => {
                            if (confirm(`Delete goal "${goal.name}"?`)) deleteMutation.mutate(goal._id);
                          }}
                          className="p-1 text-surface-400 hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-2xl font-bold text-surface-900 dark:text-white">
                          {formatCurrency(goal.currentAmount)}
                        </span>
                        <span className="text-xs text-surface-500">
                          of {formatCurrency(goal.targetAmount)}
                        </span>
                      </div>

                      <ProgressBar value={goal.currentAmount} max={goal.targetAmount} className="mb-3" />

                      <div className="bg-surface-50 dark:bg-surface-800/60 p-2.5 rounded-lg text-xs space-y-1 mb-4">
                        <div className="flex justify-between text-surface-600 dark:text-surface-300">
                          <span>Required Monthly Pace:</span>
                          <span className="font-semibold text-primary-600 dark:text-primary-400">
                            {formatCurrency(goal.requiredMonthlyContribution)}/mo
                          </span>
                        </div>
                        <div className="flex justify-between text-surface-500">
                          <span>Remaining Amount:</span>
                          <span>{formatCurrency(goal.remaining)}</span>
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        className="w-full gap-2 text-xs"
                        onClick={() => setContributingGoal(goal)}
                      >
                        <Coins className="w-4 h-4 text-emerald-600" /> Add Funds
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div className="pt-4">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Completed Goals
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedGoals.map((goal: any) => (
                  <Card key={goal._id} className="border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <CardTitle className="text-base font-semibold">{goal.name}</CardTitle>
                      </div>
                      <Badge variant="success">Completed</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-emerald-600 mt-1">
                        {formatCurrency(goal.targetAmount)}
                      </div>
                      <p className="text-xs text-surface-500 mt-1">Goal successfully achieved!</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Goal Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Savings Goal">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
          <Input
            label="Goal Name"
            placeholder="e.g. Emergency Fund, New Laptop, Japan Trip"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.targetAmount || ''}
              onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
              required
            />
            <Input
              label="Starting Saved"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.currentAmount || ''}
              onChange={(e) => setFormData({ ...formData, currentAmount: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Completion Date"
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 mb-1.5">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || formData.targetAmount <= 0}>Create Goal</Button>
          </div>
        </form>
      </Modal>

      {/* Add Contribution Modal */}
      {contributingGoal && (
        <Modal isOpen={!!contributingGoal} onClose={() => setContributingGoal(null)} title={`Add Funds to "${contributingGoal.name}"`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              contributeMutation.mutate({
                id: contributingGoal._id,
                data: {
                  amount: contributionData.amount,
                  note: contributionData.note,
                  accountId: contributionData.accountId || undefined
                }
              });
            }}
            className="space-y-4"
          >
            <Input
              label="Contribution Amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={contributionData.amount || ''}
              onChange={(e) => setContributionData({ ...contributionData, amount: parseFloat(e.target.value) || 0 })}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 mb-1.5">Deduct From Account (Optional)</label>
              <select
                value={contributionData.accountId}
                onChange={(e) => setContributionData({ ...contributionData, accountId: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Do not deduct from an account</option>
                {accounts.map((a: any) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({formatCurrency(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Note (Optional)"
              placeholder="e.g. Monthly bonus, Birthday gift money"
              value={contributionData.note}
              onChange={(e) => setContributionData({ ...contributionData, note: e.target.value })}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setContributingGoal(null)}>Cancel</Button>
              <Button type="submit" disabled={contributeMutation.isPending || contributionData.amount <= 0}>
                Confirm Contribution
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
