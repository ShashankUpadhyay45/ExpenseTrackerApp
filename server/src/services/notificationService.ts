import { Notification } from '../models/Notification.js';
import { Budget } from '../models/Budget.js';
import { Bill } from '../models/Bill.js';
import { AppError } from '../utils/AppError.js';

export const notificationService = {
  create: async (userId: string, data: any) => {
    return await Notification.create({
      ...data,
      userId,
      isRead: false,
      isDismissed: false
    });
  },

  getAll: async (userId: string, page: number = 1, limit: number = 20) => {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      Notification.find({ userId, isDismissed: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ userId, isDismissed: false })
    ]);

    return {
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  },

  getUnreadCount: async (userId: string) => {
    const count = await Notification.countDocuments({
      userId,
      isRead: false,
      isDismissed: false
    });
    return { unreadCount: count };
  },

  markRead: async (userId: string, id: string) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) throw new AppError('Notification not found', 404);
    return notification;
  },

  markAllRead: async (userId: string) => {
    await Notification.updateMany(
      { userId, isDismissed: false },
      { isRead: true }
    );
    return { message: 'All notifications marked as read' };
  },

  dismiss: async (userId: string, id: string) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isDismissed: true },
      { new: true }
    );
    if (!notification) throw new AppError('Notification not found', 404);
    return { message: 'Notification dismissed' };
  },

  checkSystemAlerts: async (userId: string) => {
    // 1. Check budget thresholds
    const budgets = await Budget.find({ userId, isActive: true });
    for (const b of budgets) {
      if (b.amount > 0 && b.spent >= (b.amount * (b.alertThreshold / 100))) {
        const existing = await Notification.findOne({
          userId,
          type: 'budget_alert',
          'data.budgetId': b._id,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        if (!existing) {
          await Notification.create({
            userId,
            type: 'budget_alert',
            title: `Budget Alert: ${b.category}`,
            message: `You have spent ${Math.round((b.spent / b.amount) * 100)}% of your ${b.category} budget!`,
            data: { budgetId: b._id, category: b.category, spent: b.spent, limit: b.amount }
          });
        }
      }
    }

    // 2. Check upcoming bills
    const now = new Date();
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);

    const upcomingBills = await Bill.find({
      userId,
      isActive: true,
      isPaid: false,
      nextDueDate: { $gte: now, $lte: in3Days }
    });

    for (const bill of upcomingBills) {
      const existing = await Notification.findOne({
        userId,
        type: 'bill_reminder',
        'data.billId': bill._id,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      if (!existing) {
        await Notification.create({
          userId,
          type: 'bill_reminder',
          title: `Upcoming Bill: ${bill.name}`,
          message: `Bill of $${bill.amount.toFixed(2)} is due on ${new Date(bill.nextDueDate).toLocaleDateString()}`,
          data: { billId: bill._id, amount: bill.amount, dueDate: bill.nextDueDate }
        });
      }
    }
  }
};