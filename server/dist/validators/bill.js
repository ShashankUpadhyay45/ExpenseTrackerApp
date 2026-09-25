import { z } from 'zod';
export const createBillSchema = z.object({ body: z.object({ name: z.string(), amount: z.number().positive(), category: z.string(), frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly', 'custom']), dueDate: z.string(), nextDueDate: z.string() }) });
export const updateBillSchema = z.object({ params: z.object({ id: z.string() }), body: createBillSchema.shape.body.partial() });
export const recordPaymentSchema = z.object({ params: z.object({ id: z.string() }), body: z.object({ amount: z.number().positive(), date: z.string() }) });
