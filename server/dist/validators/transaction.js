import { z } from 'zod';
export const createTransactionSchema = z.object({
    body: z.object({
        accountId: z.string(),
        type: z.enum(['income', 'expense', 'transfer']),
        amount: z.number().positive(),
        date: z.string().datetime().or(z.date()),
        description: z.string().optional(),
        category: z.string(),
        subcategory: z.string().optional(),
        merchant: z.string().optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
        paymentMethod: z.string().optional(),
        recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
        isRecurring: z.boolean().optional(),
        transferToAccountId: z.string().optional()
    })
});
export const updateTransactionSchema = z.object({
    params: z.object({ id: z.string() }),
    body: createTransactionSchema.shape.body.partial()
});
export const transactionQuerySchema = z.object({
    query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        type: z.string().optional(),
        category: z.string().optional(),
        accountId: z.string().optional(),
        limit: z.string().optional(),
        page: z.string().optional()
    })
});
