import { Account } from '../models/Account.js';
export const accountService = {
    create: async (data) => await Account.create(data),
    getAll: async (query) => await Account.find(query),
    getById: async (id) => await Account.findById(id),
    update: async (id, data) => await Account.findByIdAndUpdate(id, data, { new: true }),
    delete: async (id) => await Account.findByIdAndDelete(id)
};
