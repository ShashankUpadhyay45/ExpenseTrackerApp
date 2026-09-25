import { Notification } from '../models/Notification.js';
export const notificationService = {
    create: async (data) => await Notification.create(data),
    getAll: async (userId) => await Notification.find({ userId })
};
