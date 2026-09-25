import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  spent: { type: Number, default: 0 },
  period: { type: String, enum: ['monthly', 'weekly', 'yearly', 'custom'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  rollover: { type: Boolean, default: false },
  rolloverAmount: { type: Number, default: 0 },
  alertThreshold: { type: Number, default: 80 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

budgetSchema.index({ userId: 1 });
budgetSchema.index({ userId: 1, categoryId: 1 });

export const Budget = mongoose.model('Budget', budgetSchema);
