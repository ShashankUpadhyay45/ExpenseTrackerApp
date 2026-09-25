import { Budget } from '../models/Budget.js';
export const budgetService = {
    create: async (data) => await Budget.create(data),
    getAll: async (query) => await Budget.find(query),
    getById: async (id) => await Budget.findById(id),
    update: async (id, data) => await Budget.findByIdAndUpdate(id, data, { new: true }),
    delete: async (id) => await Budget.findByIdAndDelete(id)
};
