import { z } from 'zod';
export const createBudgetSchema = z.object({ body: z.object({ category: z.string(), amount: z.number().positive(), period: z.enum(['monthly', 'weekly', 'yearly', 'custom']), startDate: z.string(), endDate: z.string() }) });
export const updateBudgetSchema = z.object({ params: z.object({ id: z.string() }), body: createBudgetSchema.shape.body.partial() });