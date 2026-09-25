import { z } from 'zod';
export const createAccountSchema = z.object({ body: z.object({ name: z.string(), type: z.enum(['cash', 'bank', 'wallet', 'debit', 'credit', 'savings']), balance: z.number().optional() }) });
export const updateAccountSchema = z.object({ params: z.object({ id: z.string() }), body: createAccountSchema.shape.body.partial() });
export const transferSchema = z.object({ body: z.object({ fromAccountId: z.string(), toAccountId: z.string(), amount: z.number().positive(), date: z.string() }) });
