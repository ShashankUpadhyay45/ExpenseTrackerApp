import { z } from 'zod';
export const createGoalSchema = z.object({ body: z.object({ name: z.string(), targetAmount: z.number().positive(), targetDate: z.string() }) });
export const updateGoalSchema = z.object({ params: z.object({ id: z.string() }), body: createGoalSchema.shape.body.partial() });
export const addContributionSchema = z.object({ params: z.object({ id: z.string() }), body: z.object({ amount: z.number().positive(), date: z.string().optional(), note: z.string().optional() }) });
