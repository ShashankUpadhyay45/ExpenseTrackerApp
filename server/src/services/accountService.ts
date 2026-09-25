import { Account } from '../models/Account.js';
export const accountService = {
  create: async (data: any) => await Account.create(data),
  getAll: async (query: any) => await Account.find(query),
  getById: async (id: string) => await Account.findById(id),
  update: async (id: string, data: any) => await Account.findByIdAndUpdate(id, data, { new: true }),
  delete: async (id: string) => await Account.findByIdAndDelete(id)
};