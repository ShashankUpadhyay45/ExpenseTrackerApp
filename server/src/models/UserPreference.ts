import mongoose from 'mongoose';

const userPreferenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currency: { type: String, default: 'USD' },
  locale: { type: String, default: 'en-US' },
  dateFormat: { type: String, default: 'MM/DD/YYYY' },
  theme: { type: String, default: 'system' },
  defaultAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  fiscalYearStart: { type: Number, default: 1 }, // 1 = Jan
  notificationPreferences: {
    budgetAlerts: { type: Boolean, default: true },
    billReminders: { type: Boolean, default: true },
    unusualSpending: { type: Boolean, default: true },
    goalMilestones: { type: Boolean, default: true },
    monthlyReport: { type: Boolean, default: true },
    importComplete: { type: Boolean, default: true }
  },
  categories: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

userPreferenceSchema.index({ userId: 1 }, { unique: true });

export const UserPreference = mongoose.model('UserPreference', userPreferenceSchema);
