import { Goal } from '../models/Goal.js';
export const goalService = {
    create: async (data) => await Goal.create(data),
    getAll: async (query) => await Goal.find(query),
    getById: async (id) => await Goal.findById(id),
    update: async (id, data) => await Goal.findByIdAndUpdate(id, data, { new: true }),
    delete: async (id) => await Goal.findByIdAndDelete(id)
};
