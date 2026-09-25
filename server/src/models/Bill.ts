import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  isVariable: { type: Boolean, default: false },
  category: { type: String, required: true },
  merchant: { type: String },
  frequency: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly', 'custom'], required: true },
  dueDate: { type: Date, required: true },
  nextDueDate: { type: Date, required: true },
  reminders: [{ type: Number }], // days before due date
  isPaid: { type: Boolean, default: false },
  isAutoPay: { type: Boolean, default: false },
  lastPaidDate: { type: Date },
  paymentHistory: [{
    date: Date,
    amount: Number,
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
  }],
  isActive: { type: Boolean, default: true },
  notes: { type: String }
}, { timestamps: true });

billSchema.index({ userId: 1 });
billSchema.index({ userId: 1, nextDueDate: 1 });

export const Bill = mongoose.model('Bill', billSchema);
