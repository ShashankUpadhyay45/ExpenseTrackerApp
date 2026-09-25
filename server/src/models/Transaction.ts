import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  type: { type: String, enum: ['income', 'expense', 'transfer'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  time: { type: String },
  description: { type: String },
  category: { type: String, required: true },
  subcategory: { type: String },
  merchant: { type: String },
  notes: { type: String },
  tags: [{ type: String }],
  paymentMethod: { type: String },
  recurrence: { type: String, enum: ['none', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'], default: 'none' },
  isRecurring: { type: Boolean, default: false },
  transferToAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  receiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt' },
  importJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImportJob' },
  location: { type: String }
}, { timestamps: true });

transactionSchema.index({ userId: 1 });
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, merchant: 1 });
transactionSchema.index({ userId: 1, accountId: 1 });

transactionSchema.virtual('formattedAmount').get(function() {
  return this.amount.toFixed(2);
});

export const Transaction = mongoose.model('Transaction', transactionSchema);
