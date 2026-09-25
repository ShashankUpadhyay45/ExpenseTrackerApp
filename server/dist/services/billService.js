import { Bill } from '../models/Bill.js';
export const billService = {
    create: async (data) => await Bill.create(data),
    getAll: async (query) => await Bill.find(query),
    getById: async (id) => await Bill.findById(id),
    update: async (id, data) => await Bill.findByIdAndUpdate(id, data, { new: true }),
    delete: async (id) => await Bill.findByIdAndDelete(id)
};
