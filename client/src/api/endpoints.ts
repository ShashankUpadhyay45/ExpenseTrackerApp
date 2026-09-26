import { apiClient } from './client';
import type { Transaction, Budget, Bill, Goal, Account, Category } from '../types';

export const authApi = {
  login: (data: { email: string; password: string }) => apiClient.post('/auth/login', data),
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => apiClient.post('/auth/register', data),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: (refreshToken: string) => apiClient.post('/auth/refresh-token', { refreshToken }),
  changePassword: (data: { currentPassword: string; newPassword: string }) => apiClient.patch('/auth/change-password', data),
  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
};

export const transactionsApi = {
  getAll: (params?: Record<string, any>) => apiClient.get('/transactions', { params }),
  getById: (id: string) => apiClient.get(`/transactions/${id}`),
  create: (data: Partial<Transaction>) => apiClient.post('/transactions', data),
  update: (id: string, data: Partial<Transaction>) => apiClient.patch(`/transactions/${id}`, data),
  delete: (id: string) => apiClient.delete(`/transactions/${id}`),
  bulkDelete: (ids: string[]) => apiClient.post('/transactions/bulk-delete', { ids }),
  duplicate: (id: string) => apiClient.post(`/transactions/${id}/duplicate`),
  search: (query: string) => apiClient.get('/transactions/search', { params: { q: query } }),
  getDuplicates: () => apiClient.get('/transactions/duplicates'),
};

export const budgetsApi = {
  getAll: () => apiClient.get('/budgets'),
  getById: (id: string) => apiClient.get(`/budgets/${id}`),
  create: (data: Partial<Budget>) => apiClient.post('/budgets', data),
  update: (id: string, data: Partial<Budget>) => apiClient.patch(`/budgets/${id}`, data),
  delete: (id: string) => apiClient.delete(`/budgets/${id}`),
};

export const billsApi = {
  getAll: () => apiClient.get('/bills'),
  getById: (id: string) => apiClient.get(`/bills/${id}`),
  create: (data: Partial<Bill>) => apiClient.post('/bills', data),
  update: (id: string, data: Partial<Bill>) => apiClient.patch(`/bills/${id}`, data),
  delete: (id: string) => apiClient.delete(`/bills/${id}`),
  markPaid: (id: string, data?: { accountId?: string; amount?: number; date?: string }) =>
    apiClient.post(`/bills/${id}/mark-paid`, data),
};

export const goalsApi = {
  getAll: () => apiClient.get('/goals'),
  getById: (id: string) => apiClient.get(`/goals/${id}`),
  create: (data: Partial<Goal>) => apiClient.post('/goals', data),
  update: (id: string, data: Partial<Goal>) => apiClient.patch(`/goals/${id}`, data),
  delete: (id: string) => apiClient.delete(`/goals/${id}`),
  addContribution: (id: string, data: { amount: number, note?: string }) => apiClient.post(`/goals/${id}/contribute`, data),
};

export const accountsApi = {
  getAll: () => apiClient.get('/accounts'),
  getById: (id: string) => apiClient.get(`/accounts/${id}`),
  create: (data: Partial<Account>) => apiClient.post('/accounts', data),
  update: (id: string, data: Partial<Account>) => apiClient.patch(`/accounts/${id}`, data),
  delete: (id: string) => apiClient.delete(`/accounts/${id}`),
  transfer: (data: { fromId: string; toId: string; amount: number; note?: string }) => apiClient.post('/accounts/transfer', data),
};

export const categoriesApi = {
  getAll: () => apiClient.get('/categories'),
  create: (data: Partial<Category>) => apiClient.post('/categories', data),
  update: (id: string, data: Partial<Category>) => apiClient.patch(`/categories/${id}`, data),
  delete: (id: string) => apiClient.delete(`/categories/${id}`),
};

export const analyticsApi = {
  getDashboard: () => apiClient.get('/analytics/dashboard'),
  getSummary: (params?: { startDate?: string; endDate?: string }) => apiClient.get('/analytics/summary', { params }),
  getMonthlySummary: (month: string) => apiClient.get('/analytics/monthly', { params: { month } }),
  getCategoryTrends: (months?: number) => apiClient.get('/analytics/category-trends', { params: { months } }),
  getMerchantTrends: (months?: number) => apiClient.get('/analytics/merchant-trends', { params: { months } }),
  getIncomeVsExpenses: (months?: number) => apiClient.get('/analytics/income-vs-expenses', { params: { months } }),
  getSpendingByDayOfWeek: (params?: { startDate?: string; endDate?: string }) => apiClient.get('/analytics/spending-by-day', { params }),
  getCashFlowTrend: (months?: number) => apiClient.get('/analytics/cash-flow', { params: { months } }),
  getPeriodComparison: (period1Start: string, period1End: string, period2Start: string, period2End: string) =>
    apiClient.get('/analytics/compare', { params: { period1Start, period1End, period2Start, period2End } }),
  getLargestTransactions: (limit?: number, params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/analytics/largest', { params: { limit, ...params } }),
};

export const aiApi = {
  query: (question: string) => apiClient.post('/ai/query', { question }),
  getSummary: () => apiClient.get('/ai/summary'),
  categorize: (description: string) => apiClient.post('/ai/categorize', { description }),
  detectAnomalies: () => apiClient.get('/ai/anomalies'),
  forecast: (months?: number) => apiClient.get('/ai/forecast', { params: { months } }),
  whatIf: (scenario: { category: string; change: number }) => apiClient.post('/ai/what-if', scenario),
};

export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number }) => apiClient.get('/notifications', { params }),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/read-all'),
  dismiss: (id: string) => apiClient.delete(`/notifications/${id}`),
};

export const receiptsApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return apiClient.post('/receipts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getById: (id: string) => apiClient.get(`/receipts/${id}`),
};

export const importsApi = {
  uploadCSV: (file: File, mapping?: Record<string, string>) => {
    const formData = new FormData();
    formData.append('file', file);
    if (mapping) formData.append('mapping', JSON.stringify(mapping));
    return apiClient.post('/imports/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadJSON: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/imports/json', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getJobStatus: (jobId: string) => apiClient.get(`/imports/${jobId}`),
};

export const reportsApi = {
  generate: (params: { type: string; startDate: string; endDate: string }) => apiClient.post('/reports/generate', params),
  downloadPDF: (params: { startDate: string; endDate: string }) =>
    apiClient.get('/reports/pdf', { params, responseType: 'blob' }),
  exportCSV: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/reports/csv', { params, responseType: 'blob' }),
  exportJSON: () => apiClient.get('/reports/json', { responseType: 'blob' }),
};

export const searchApi = {
  global: (query: string) => apiClient.get('/search', { params: { q: query } }),
};

export const userApi = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data: { firstName?: string; lastName?: string }) => apiClient.patch('/users/profile', data),
  getPreferences: () => apiClient.get('/users/preferences'),
  updatePreferences: (data: Record<string, any>) => apiClient.patch('/users/preferences', data),
  deleteAccount: () => apiClient.delete('/users/account'),
};
