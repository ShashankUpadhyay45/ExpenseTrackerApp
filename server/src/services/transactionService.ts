import { Transaction } from '../models/Transaction.js';
export const transactionService = {
  create: async (data: any) => await Transaction.create(data),
  getAll: async (query: any) => await Transaction.find(query),
  getById: async (id: string) => await Transaction.findById(id),
  update: async (id: string, data: any) => await Transaction.findByIdAndUpdate(id, data, { new: true }),
  delete: async (id: string) => await Transaction.findByIdAndDelete(id)
};