import { Transaction } from '../models/Transaction.js';
export const transactionService = {
    create: async (data) => await Transaction.create(data),
    getAll: async (query) => await Transaction.find(query),
    getById: async (id) => await Transaction.findById(id),
    update: async (id, data) => await Transaction.findByIdAndUpdate(id, data, { new: true }),
    delete: async (id) => await Transaction.findByIdAndDelete(id)
};
