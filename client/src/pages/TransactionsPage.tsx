import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, accountsApi, categoriesApi, aiApi, receiptsApi } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency } from '../utils/formatters';
import {
  Plus, Search, ArrowUpRight, ArrowDownRight, ArrowRightLeft,
  Camera, Trash2, Copy, Download, RefreshCw, FileText
} from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: 'Food & Drink',
    merchant: '',
    accountId: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
    recurrence: 'none'
  });

  // Queries
  const { data: accountsRes } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAll()
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll()
  });

  const { data: txRes, isLoading } = useQuery({
    queryKey: ['transactions', search, typeFilter, categoryFilter, monthFilter],
    queryFn: () => transactionsApi.getAll({
      q: search || undefined,
      type: typeFilter || undefined,
      category: categoryFilter || undefined,
      dateFrom: monthFilter ? `${monthFilter}-01` : undefined,
      dateTo: monthFilter ? `${monthFilter}-31` : undefined
    })
  });

  const accounts = accountsRes?.data?.data || [];
  const categories = categoriesRes?.data?.data || [];
  const transactionsData = txRes?.data?.data;
  const transactions = Array.isArray(transactionsData) ? transactionsData : (transactionsData?.transactions || []);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsAddOpen(false);
      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        category: 'Food & Drink',
        merchant: '',
        accountId: accounts[0]?._id || '',
        date: new Date().toISOString().slice(0, 10),
        notes: '',
        recurrence: 'none'
      });
      toast.success('Transaction logged successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save transaction')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transaction deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete')
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transaction duplicated for today');
    }
  });

  // Smart Auto-Categorization on description change
  const handleDescriptionChange = async (val: string) => {
    setFormData(prev => ({ ...prev, description: val }));
    if (val.length > 2) {
      try {
        const res = await aiApi.categorize(val);
        if (res.data?.data?.category) {
          setFormData(prev => ({ ...prev, category: res.data.data.category }));
        }
      } catch (e) {}
    }
  };

  // OCR Receipt Scan
  const handleReceiptScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    toast.info('Scanning receipt with OCR engine...');
    try {
      const res = await receiptsApi.upload(file);
      const extracted = res.data?.data?.extractedData;
      if (extracted) {
        setFormData(prev => ({
          ...prev,
          amount: extracted.amount ? String(extracted.amount) : prev.amount,
          merchant: extracted.merchant || prev.merchant,
          description: extracted.merchant ? `Receipt from ${extracted.merchant}` : prev.description,
          date: extracted.date ? new Date(extracted.date).toISOString().slice(0, 10) : prev.date
        }));
        toast.success(`OCR detected: $${extracted.amount} at ${extracted.merchant || 'merchant'}`);
      }
    } catch (err: any) {
      toast.error('OCR failed to read receipt clearly.');
    } finally {
      setIsScanning(false);
    }
  };

  // Export CSV of currently filtered view
  const handleExportCSV = () => {
    if (transactions.length === 0) return toast.info('No transactions to export');
    const headers = ['Date', 'Type', 'Category', 'Description', 'Merchant', 'Amount'];
    const rows = transactions.map((t: any) => [
      new Date(t.date).toISOString().slice(0, 10),
      t.type,
      t.category,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      t.amount
    ]);
    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SpendSage_Filtered_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">Transactions Ledger</h1>
          <p className="text-sm text-surface-500">Track and categorize every income, expense, and account transfer.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExportCSV} className="gap-2 text-xs">
            <Download className="w-3.5 h-3.5" /> Export View
          </Button>
          <Button onClick={() => {
            if (accounts.length > 0 && !formData.accountId) {
              setFormData(prev => ({ ...prev, accountId: accounts[0]._id }));
            }
            setIsAddOpen(true);
          }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Transaction
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search description, merchant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 h-9 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types (Income & Expenses)</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
              <option value="transfer">Transfers Only</option>
            </select>

            {/* Month Filter */}
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              <option value="Food & Drink">Food & Drink</option>
              <option value="Groceries">Groceries</option>
              <option value="Transport">Transport</option>
              <option value="Shopping">Shopping</option>
              <option value="Bills">Bills</option>
              <option value="Salary">Salary</option>
              <option value="Savings">Savings</option>
              <option value="Investments">Investments</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Data Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-surface-500">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={FileText}
                title="No transactions found"
                description="No records match your active search or filter criteria."
                actionLabel="Add Transaction"
                onAction={() => setIsAddOpen(true)}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Description & Merchant</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5 text-right">Amount</th>
                    <th className="px-6 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800/60">
                  {transactions.map((tx: any) => {
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';

                    return (
                      <tr key={tx._id} className="hover:bg-surface-50/60 dark:hover:bg-surface-800/40 transition-colors">
                        <td className="px-6 py-3 text-xs text-surface-500 whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isIncome ? 'bg-emerald-100 text-emerald-600' : isTransfer ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'
                            }`}>
                              {isIncome ? <ArrowUpRight className="w-4 h-4" /> : isTransfer ? <ArrowRightLeft className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            </div>
                            <div>
                              <span className="font-semibold text-surface-900 dark:text-white block">
                                {tx.description || tx.category}
                              </span>
                              {tx.merchant && (
                                <span className="text-[11px] text-surface-400 block">{tx.merchant}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant="outline" className="text-xs">
                            {tx.category}
                          </Badge>
                        </td>
                        <td className={`px-6 py-3 text-right font-bold whitespace-nowrap ${
                          isIncome ? 'text-emerald-600' : isTransfer ? 'text-indigo-600' : 'text-surface-900 dark:text-white'
                        }`}>
                          {isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => duplicateMutation.mutate(tx._id)}
                              title="Duplicate transaction"
                              className="p-1 text-surface-400 hover:text-indigo-600 rounded"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete this transaction?')) deleteMutation.mutate(tx._id);
                              }}
                              title="Delete transaction"
                              className="p-1 text-surface-400 hover:text-rose-500 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Modal with OCR & Auto-Categorization */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Transaction" size="lg">
        <div className="space-y-4">
          {/* Scan Receipt Header */}
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 block">Scan Paper Receipt</span>
                <span className="text-[11px] text-surface-500">Tesseract OCR auto-fills amount, date, and merchant</span>
              </div>
            </div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-surface-800 border border-indigo-300 dark:border-indigo-700 text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50">
              {isScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              {isScanning ? 'Reading...' : 'Upload Image'}
              <input type="file" accept="image/*" onChange={handleReceiptScan} className="hidden" disabled={isScanning} />
            </label>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const amt = parseFloat(formData.amount);
              if (isNaN(amt) || amt <= 0) return toast.error('Please enter a valid amount');
              createMutation.mutate({
                ...formData,
                amount: amt,
                accountId: formData.accountId || accounts[0]?._id
              });
            }}
            className="space-y-4"
          >
            {/* Type selector */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl">
              {(['expense', 'income', 'transfer'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t })}
                  className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    formData.type === t
                      ? 'bg-white dark:bg-surface-700 text-primary-600 shadow-sm'
                      : 'text-surface-500 hover:text-surface-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />

              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <Input
              label="Description (Auto-categorizes as you type)"
              placeholder="e.g. Uber ride to airport, Walmart grocery run, Salary"
              value={formData.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 mb-1.5">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Food & Drink">Food & Drink</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Transport">Transport</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Bills">Bills</option>
                  <option value="Salary">Salary</option>
                  <option value="Savings">Savings</option>
                  <option value="Investments">Investments</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Health & Medical">Health & Medical</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 mb-1.5">Account</label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  {accounts.map((a: any) => (
                    <option key={a._id} value={a._id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Merchant / Payee (Optional)"
                placeholder="e.g. Starbucks, Uber, Amazon"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 mb-1.5">Recurrence</label>
                <select
                  value={formData.recurrence}
                  onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="none">One-time</option>
                  <option value="monthly">Monthly Fixed</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || !formData.amount}>Save Transaction</Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
