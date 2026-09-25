import { Notification } from '../models/Notification.js';
export const notificationService = {
  create: async (data: any) => await Notification.create(data),
  getAll: async (userId: string) => await Notification.find({ userId })
};