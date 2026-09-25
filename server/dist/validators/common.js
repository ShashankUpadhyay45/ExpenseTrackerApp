import { z } from 'zod';
export const paginationSchema = z.object({ query: z.object({ page: z.string().optional(), limit: z.string().optional() }) });
export const dateRangeSchema = z.object({ query: z.object({ startDate: z.string(), endDate: z.string() }) });
export const mongoIdSchema = z.object({ params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') }) });
