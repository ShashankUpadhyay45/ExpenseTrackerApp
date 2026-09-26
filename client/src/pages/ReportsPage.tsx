import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/endpoints';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils/formatters';
import { Download, FileSpreadsheet, Database, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  });

  // Query report data for preview
  const { data: reportRes, isLoading, refetch } = useQuery({
    queryKey: ['report', dateRange.startDate, dateRange.endDate],
    queryFn: () => reportsApi.generate({ type: 'custom', ...dateRange })
  });

  const report = reportRes?.data?.data;

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDownloadPDF = async () => {
    try {
      toast.info('Generating PDF financial statement...');
      const res = await reportsApi.downloadPDF(dateRange);
      downloadFile(res.data, `SpendSage_Report_${dateRange.startDate}_to_${dateRange.endDate}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (e) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await reportsApi.exportCSV(dateRange);
      downloadFile(res.data, `SpendSage_Transactions_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
      toast.success('CSV exported successfully');
    } catch (e) {
      toast.error('Failed to export CSV');
    }
  };

  const handleExportJSON = async () => {
    try {
      const res = await reportsApi.exportJSON();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      downloadFile(blob, `SpendSage_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      toast.success('Full JSON backup downloaded');
    } catch (e) {
      toast.error('Failed to export JSON backup');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">Financial Reports & Exports</h1>
          <p className="text-sm text-surface-500">Generate executive financial summaries, PDF statements, CSV ledgers, and data backups.</p>
        </div>
      </div>

      {/* Date Range Selector & Action Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-surface-400" />
                <span className="text-xs font-semibold text-surface-600 dark:text-surface-300">Period:</span>
              </div>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-xs text-surface-400">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button variant="secondary" onClick={() => refetch()} className="text-xs h-9">
                Update Report
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleDownloadPDF} className="gap-2 text-xs h-9">
                <Download className="w-3.5 h-3.5" /> Download PDF
              </Button>
              <Button variant="secondary" onClick={handleExportCSV} className="gap-2 text-xs h-9">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
              </Button>
              <Button variant="ghost" onClick={handleExportJSON} className="gap-2 text-xs h-9 text-surface-600">
                <Database className="w-3.5 h-3.5" /> Backup JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-sm text-surface-500">Generating statement preview...</div>
      ) : !report ? (
        <div className="h-64 flex items-center justify-center text-sm text-surface-500">No data available for this range.</div>
      ) : (
        <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-1">
                <span className="text-xs text-surface-400 font-semibold uppercase">Total Income</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(report.summary.totalIncome)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <span className="text-xs text-surface-400 font-semibold uppercase">Total Expenses</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600">{formatCurrency(report.summary.totalExpenses)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <span className="text-xs text-surface-400 font-semibold uppercase">Net Savings</span>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${report.summary.netSavings >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                  {formatCurrency(report.summary.netSavings)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <span className="text-xs text-surface-400 font-semibold uppercase">Savings Rate</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-surface-900 dark:text-white">
                  {report.summary.savingsRate}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Outflows breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Spending Categories</CardTitle>
                <CardDescription>Primary outflows recorded during this date window.</CardDescription>
              </CardHeader>
              <CardContent>
                {report.topCategories.length === 0 ? (
                  <p className="text-xs text-surface-400">No categorized expenses in this date window.</p>
                ) : (
                  <div className="space-y-3">
                    {report.topCategories.map((c: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-sm border-b border-surface-100 dark:border-surface-800/60 pb-2">
                        <span className="font-medium text-surface-800 dark:text-surface-200">{c.category}</span>
                        <div className="text-right">
                          <span className="font-bold text-surface-900 dark:text-white">{formatCurrency(c.amount)}</span>
                          <span className="text-xs text-surface-400 ml-2">({c.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Accounts & Assets Snapshot</CardTitle>
                <CardDescription>Current balance status across all active accounts.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.accounts.map((a: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b border-surface-100 dark:border-surface-800/60 pb-2">
                      <div>
                        <span className="font-medium text-surface-800 dark:text-surface-200">{a.name}</span>
                        <span className="text-xs text-surface-400 capitalize block">{a.type}</span>
                      </div>
                      <span className={`font-bold ${a.type === 'credit' ? 'text-rose-600' : 'text-surface-900 dark:text-white'}`}>
                        {formatCurrency(a.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
