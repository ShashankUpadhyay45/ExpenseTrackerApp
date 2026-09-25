import { Bill } from '../models/Bill.js';
export const billService = {
  create: async (data: any) => await Bill.create(data),
  getAll: async (query: any) => await Bill.find(query),
  getById: async (id: string) => await Bill.findById(id),
  update: async (id: string, data: any) => await Bill.findByIdAndUpdate(id, data, { new: true }),
  delete: async (id: string) => await Bill.findByIdAndDelete(id)
};