export interface User { _id: string; email: string; firstName: string; lastName: string; avatar?: string; isEmailVerified: boolean; createdAt: string; }

export interface Account { _id: string; userId: string; name: string; type: 'cash' | 'bank' | 'wallet' | 'debit' | 'credit' | 'savings'; balance: number; openingBalance: number; currency: string; creditLimit?: number; isDefault: boolean; isActive: boolean; icon?: string; color?: string; createdAt: string; }

export interface Transaction { _id: string; userId: string; accountId: string; type: 'income' | 'expense' | 'transfer'; amount: number; date: string; time?: string; description: string; category: string; subcategory?: string; merchant?: string; notes?: string; tags: string[]; paymentMethod?: string; recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'; isRecurring: boolean; transferToAccountId?: string; receiptId?: string; createdAt: string; }

export interface Category { _id: string; userId: string; name: string; type: 'income' | 'expense'; icon?: string; color?: string; subcategories: string[]; isDefault: boolean; isActive: boolean; sortOrder: number; }

export interface Budget { _id: string; userId: string; categoryId?: string; category: string; amount: number; spent: number; period: 'monthly' | 'weekly' | 'yearly' | 'custom'; startDate?: string; endDate?: string; rollover: boolean; rolloverAmount: number; alertThreshold: number; isActive: boolean; createdAt: string; }

export interface Bill { _id: string; userId: string; name: string; amount: number; isVariable: boolean; category?: string; merchant?: string; frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'; dueDate: number; nextDueDate: string; reminders: number[]; isPaid: boolean; isAutoPay: boolean; lastPaidDate?: string; paymentHistory: Array<{ date: string; amount: number; transactionId?: string }>; isActive: boolean; notes?: string; createdAt: string; }

export interface Goal { _id: string; userId: string; name: string; targetAmount: number; currentAmount: number; targetDate: string; priority: 'low' | 'medium' | 'high'; contributions: Array<{ date: string; amount: number; note?: string }>; status: 'active' | 'paused' | 'completed' | 'cancelled'; icon?: string; color?: string; createdAt: string; }

export interface Notification { _id: string; userId: string; type: string; title: string; message: string; data?: Record<string, any>; isRead: boolean; isDismissed: boolean; createdAt: string; }

export interface ApiResponse<T> { status: 'success' | 'error'; data: T; message?: string; }

export interface PaginatedResponse<T> { status: 'success'; data: T[]; pagination: { page: number; limit: number; total: number; pages: number; }; }

export interface DashboardStats { balance: number; income: number; expenses: number; savings: number; savingsRate: number; budgetRemaining: number; incomeChange: number; expenseChange: number; savingsChange: number; categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>; }

export interface AnalyticsData { monthlySummary: { income: number; expenses: number; savings: number; month: string }[]; categoryTrends: Record<string, number[]>; merchantTrends: Array<{ merchant: string; amount: number }>; }
