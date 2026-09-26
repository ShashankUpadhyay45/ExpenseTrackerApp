import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { formatCurrency } from '../utils/formatters';
import { Wallet, CreditCard, Building2, PiggyBank, ArrowRightLeft, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    balance: 0,
    openingBalance: 0,
    creditLimit: 0,
    currency: 'USD',
    isDefault: false
  });

  const [transferData, setTransferData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: 0,
    notes: ''
  });

  // Queries
  const { data: accountsRes, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAll()
  });

  const accounts = accountsRes?.data?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => accountsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsAddOpen(false);
      setFormData({ name: '', type: 'bank', balance: 0, openingBalance: 0, creditLimit: 0, currency: 'USD', isDefault: false });
      toast.success('Account added successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add account')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => accountsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setEditingAccount(null);
      toast.success('Account updated successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update account')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accountsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Account deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete account')
  });

  const transferMutation = useMutation({
    mutationFn: (data: any) => accountsApi.transfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsTransferOpen(false);
      setTransferData({ fromAccountId: '', toAccountId: '', amount: 0, notes: '' });
      toast.success('Transfer completed successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Transfer failed')
  });

  // Calculate totals
  let totalAssets = 0;
  let totalLiabilities = 0;
  accounts.forEach((acc: any) => {
    if (acc.type === 'credit') {
      totalLiabilities += Math.max(0, acc.balance);
    } else {
      totalAssets += acc.balance;
    }
  });
  const netWorth = totalAssets - totalLiabilities;

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'credit': return <CreditCard className="w-5 h-5 text-rose-500" />;
      case 'savings': return <PiggyBank className="w-5 h-5 text-emerald-500" />;
      case 'wallet': return <Wallet className="w-5 h-5 text-amber-500" />;
      default: return <Building2 className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">Accounts & Wallets</h1>
          <p className="text-sm text-surface-500">Track all your cash, bank accounts, cards, and liquid assets in one place.</p>
        </div>
        <div className="flex gap-2">
          {accounts.length >= 2 && (
            <Button variant="secondary" onClick={() => setIsTransferOpen(true)} className="gap-2">
              <ArrowRightLeft className="w-4 h-4" /> Transfer
            </Button>
          )}
          <Button onClick={() => setIsAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Account
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-surface-900 border-indigo-200 dark:border-indigo-900/50">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Total Net Worth</span>
          </CardHeader>
          <CardContent>
            <h2 className="text-3xl font-extrabold text-indigo-950 dark:text-indigo-100">{formatCurrency(netWorth)}</h2>
            <p className="text-xs text-surface-500 mt-1">Combined liquid balance minus credit debt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Assets</span>
          </CardHeader>
          <CardContent>
            <h2 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalAssets)}</h2>
            <p className="text-xs text-surface-500 mt-1">Bank, Cash, and Savings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Credit Liabilities</span>
          </CardHeader>
          <CardContent>
            <h2 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{formatCurrency(totalLiabilities)}</h2>
            <p className="text-xs text-surface-500 mt-1">Current credit card balances</p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts linked"
          description="Create your first bank account or wallet to start logging financial transactions."
          actionLabel="Add Account"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc: any) => {
            const isCredit = acc.type === 'credit';
            const limit = acc.creditLimit || 0;
            const utilization = isCredit && limit > 0 ? Math.min(100, Math.round((acc.balance / limit) * 100)) : 0;

            return (
              <Card key={acc._id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-surface-100 dark:bg-surface-800">
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{acc.name}</CardTitle>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="capitalize text-[10px] py-0">{acc.type}</Badge>
                        {acc.isDefault && <Badge variant="success" className="text-[10px] py-0">Default</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingAccount(acc)}
                      className="p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete account "${acc.name}"?`)) deleteMutation.mutate(acc._id);
                      }}
                      className="p-1.5 text-surface-400 hover:text-rose-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-surface-500">Balance</span>
                    <span className={`text-2xl font-bold ${isCredit ? 'text-rose-600' : 'text-surface-900 dark:text-white'}`}>
                      {formatCurrency(acc.balance)}
                    </span>
                  </div>

                  {isCredit && limit > 0 && (
                    <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800">
                      <div className="flex justify-between text-xs text-surface-500 mb-1">
                        <span>Limit: {formatCurrency(limit)}</span>
                        <span>{utilization}% used</span>
                      </div>
                      <div className="w-full bg-surface-200 dark:bg-surface-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${utilization > 80 ? 'bg-rose-500' : utilization > 50 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Account">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
          <Input
            label="Account Name"
            placeholder="e.g. Chase Sapphire, HDFC Bank, Cash"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 mb-1.5">Account Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="bank">Bank Checking</option>
              <option value="savings">Savings Account</option>
              <option value="credit">Credit Card</option>
              <option value="cash">Cash in Hand</option>
              <option value="wallet">Digital Wallet (PayPal, UPI)</option>
            </select>
          </div>

          <Input
            label="Starting Balance"
            type="number"
            step="0.01"
            value={formData.balance}
            onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0, openingBalance: parseFloat(e.target.value) || 0 })}
            required
          />

          {formData.type === 'credit' && (
            <Input
              label="Credit Limit"
              type="number"
              step="0.01"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
            />
          )}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
            />
            <label htmlFor="isDefault" className="text-sm text-surface-700 dark:text-surface-300">Set as Primary Default Account</label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>Create Account</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Account Modal */}
      {editingAccount && (
        <Modal isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} title="Edit Account">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({ id: editingAccount._id, data: editingAccount });
            }}
            className="space-y-4"
          >
            <Input
              label="Account Name"
              value={editingAccount.name}
              onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
              required
            />
            <Input
              label="Current Balance"
              type="number"
              step="0.01"
              value={editingAccount.balance}
              onChange={(e) => setEditingAccount({ ...editingAccount, balance: parseFloat(e.target.value) || 0 })}
              required
            />
            {editingAccount.type === 'credit' && (
              <Input
                label="Credit Limit"
                type="number"
                step="0.01"
                value={editingAccount.creditLimit || 0}
                onChange={(e) => setEditingAccount({ ...editingAccount, creditLimit: parseFloat(e.target.value) || 0 })}
              />
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setEditingAccount(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Transfer Modal */}
      <Modal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} title="Transfer Between Accounts">
        <form onSubmit={(e) => { e.preventDefault(); transferMutation.mutate(transferData); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 mb-1.5">From Account</label>
            <select
              value={transferData.fromAccountId}
              onChange={(e) => setTransferData({ ...transferData, fromAccountId: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select source account...</option>
              {accounts.map((a: any) => (
                <option key={a._id} value={a._id} disabled={a._id === transferData.toAccountId}>
                  {a.name} ({formatCurrency(a.balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 mb-1.5">To Account</label>
            <select
              value={transferData.toAccountId}
              onChange={(e) => setTransferData({ ...transferData, toAccountId: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select destination account...</option>
              {accounts.map((a: any) => (
                <option key={a._id} value={a._id} disabled={a._id === transferData.fromAccountId}>
                  {a.name} ({formatCurrency(a.balance)})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Transfer Amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={transferData.amount || ''}
            onChange={(e) => setTransferData({ ...transferData, amount: parseFloat(e.target.value) || 0 })}
            required
          />

          <Input
            label="Memo / Notes (Optional)"
            placeholder="e.g. Monthly credit card payoff, ATM withdrawal"
            value={transferData.notes}
            onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsTransferOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={transferMutation.isPending || !transferData.fromAccountId || !transferData.toAccountId || transferData.amount <= 0}>
              Execute Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
