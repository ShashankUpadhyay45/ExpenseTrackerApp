import { Goal } from '../models/Goal.js';
export const goalService = {
  create: async (data: any) => await Goal.create(data),
  getAll: async (query: any) => await Goal.find(query),
  getById: async (id: string) => await Goal.findById(id),
  update: async (id: string, data: any) => await Goal.findByIdAndUpdate(id, data, { new: true }),
  delete: async (id: string) => await Goal.findByIdAndDelete(id)
};