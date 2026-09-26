import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billsApi, accountsApi } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { formatCurrency } from '../utils/formatters';
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle, Clock, Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function BillsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'paid' | 'overdue' | 'all'>('upcoming');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [payingBill, setPayingBill] = useState<any>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    amount: 0,
    frequency: 'monthly',
    dueDate: new Date().toISOString().slice(0, 10),
    category: 'Bills',
    merchant: '',
    notes: ''
  });

  // Queries
  const { data: billsRes, isLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: () => billsApi.getAll()
  });

  const { data: accountsRes } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAll()
  });

  const bills = billsRes?.data?.data || [];
  const accounts = accountsRes?.data?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => billsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsAddOpen(false);
      setFormData({ name: '', amount: 0, frequency: 'monthly', dueDate: new Date().toISOString().slice(0, 10), category: 'Bills', merchant: '', notes: '' });
      toast.success('Bill scheduled successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add bill')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => billsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Bill deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete bill')
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, accountId }: { id: string; accountId?: string }) => billsApi.markPaid(id, { accountId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setPayingBill(null);
      setSelectedAccountId('');
      toast.success('Bill marked as paid and next due date advanced');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record bill payment')
  });

  // Filter bills
  const filteredBills = bills.filter((b: any) => {
    if (activeTab === 'all') return true;
    return b.computedStatus === activeTab;
  });

  // Calculate summary
  const upcomingTotal = bills
    .filter((b: any) => b.computedStatus === 'upcoming')
    .reduce((sum: number, b: any) => sum + b.amount, 0);

  const overdueCount = bills.filter((b: any) => b.computedStatus === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">Recurring Bills & Subscriptions</h1>
          <p className="text-sm text-surface-500">Stay on top of rent, utilities, credit cards, and recurring services.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Bill
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Upcoming Total</span>
          </CardHeader>
          <CardContent>
            <h2 className="text-3xl font-extrabold text-amber-900 dark:text-amber-300">{formatCurrency(upcomingTotal)}</h2>
            <p className="text-xs text-surface-500 mt-1">Pending bills scheduled this cycle</p>
          </CardContent>
        </Card>

        <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">Overdue Items</span>
          </CardHeader>
          <CardContent>
            <h2 className="text-3xl font-extrabold text-rose-700 dark:text-rose-400">{overdueCount}</h2>
            <p className="text-xs text-surface-500 mt-1">Bills past due date needing attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">Total Tracked</span>
          </CardHeader>
          <CardContent>
            <h2 className="text-3xl font-extrabold text-surface-900 dark:text-white">{bills.length}</h2>
            <p className="text-xs text-surface-500 mt-1">Recurring commitments registered</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'upcoming', label: `Upcoming (${bills.filter((b: any) => b.computedStatus === 'upcoming').length})` },
          { id: 'overdue', label: `Overdue (${overdueCount})` },
          { id: 'paid', label: `Paid (${bills.filter((b: any) => b.computedStatus === 'paid').length})` },
          { id: 'all', label: `All Bills (${bills.length})` }
        ]}
        activeTab={activeTab}
        onChange={(id: any) => setActiveTab(id)}
      />

      {/* Bill List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : filteredBills.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title={`No ${activeTab} bills`}
          description={activeTab === 'upcoming' ? 'No upcoming bills are due right now. Enjoy your peace of mind!' : 'No bills found in this view.'}
          actionLabel="Add Bill"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBills.map((bill: any) => {
            const isOverdue = bill.computedStatus === 'overdue';
            const isPaid = bill.computedStatus === 'paid';

            return (
              <Card key={bill._id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${isPaid ? 'bg-emerald-100 text-emerald-600' : isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                      {isPaid ? <CheckCircle2 className="w-5 h-5" /> : isOverdue ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{bill.name}</CardTitle>
                      <span className="text-xs text-surface-500 capitalize">{bill.frequency} • {bill.category}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Remove bill "${bill.name}"?`)) deleteMutation.mutate(bill._id);
                    }}
                    className="p-1.5 text-surface-400 hover:text-rose-500 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-2xl font-bold text-surface-900 dark:text-white">
                      {formatCurrency(bill.amount)}
                    </span>
                    <Badge variant={isPaid ? 'success' : isOverdue ? 'danger' : 'warning'}>
                      {isPaid ? 'Paid' : isOverdue ? `Overdue (${Math.abs(bill.daysUntilDue)}d)` : `Due in ${bill.daysUntilDue}d`}
                    </Badge>
                  </div>

                  <div className="text-xs text-surface-500 mb-4 flex items-center justify-between">
                    <span>Due: {new Date(bill.nextDueDate).toLocaleDateString()}</span>
                    {bill.merchant && <span>Merchant: {bill.merchant}</span>}
                  </div>

                  {!isPaid && (
                    <Button
                      variant="secondary"
                      className="w-full gap-2 text-xs"
                      onClick={() => setPayingBill(bill)}
                    >
                      <Check className="w-4 h-4 text-emerald-600" /> Mark as Paid
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Bill Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Schedule Recurring Bill">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
          <Input
            label="Bill Name"
            placeholder="e.g. Electric Bill, Rent, Netflix, Wifi"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 mb-1.5">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly (3 Mo)</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <Input
              label="Next Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>

          <Input
            label="Category"
            placeholder="Bills, Utilities, Housing..."
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />

          <Input
            label="Merchant / Biller (Optional)"
            placeholder="e.g. ConEdison, Comcast, Landlord"
            value={formData.merchant}
            onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>Save Bill</Button>
          </div>
        </form>
      </Modal>

      {/* Pay Bill Modal */}
      {payingBill && (
        <Modal isOpen={!!payingBill} onClose={() => setPayingBill(null)} title={`Mark "${payingBill.name}" as Paid`}>
          <div className="space-y-4">
            <p className="text-sm text-surface-600 dark:text-surface-300">
              Confirm payment of <strong>{formatCurrency(payingBill.amount)}</strong>. You can optionally select which account was used to deduct this expense automatically.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 mb-1.5">Deduct From Account (Optional)</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Do not log a transaction (Mark Paid only)</option>
                {accounts.map((a: any) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({formatCurrency(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setPayingBill(null)}>Cancel</Button>
              <Button
                onClick={() => markPaidMutation.mutate({ id: payingBill._id, accountId: selectedAccountId || undefined })}
                disabled={markPaidMutation.isPending}
              >
                Confirm Payment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
