import { Budget } from '../models/Budget.js';
export const budgetService = {
  create: async (data: any) => await Budget.create(data),
  getAll: async (query: any) => await Budget.find(query),
  getById: async (id: string) => await Budget.findById(id),
  update: async (id: string, data: any) => await Budget.findByIdAndUpdate(id, data, { new: true }),
  delete: async (id: string) => await Budget.findByIdAndDelete(id)
};