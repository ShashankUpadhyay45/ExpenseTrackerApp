import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  targetDate: { type: Date, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  contributions: [{
    date: { type: Date, default: Date.now },
    amount: Number,
    note: String
  }],
  status: { type: String, enum: ['active', 'paused', 'completed', 'cancelled'], default: 'active' },
  icon: { type: String },
  color: { type: String }
}, { timestamps: true });

goalSchema.index({ userId: 1 });

export const Goal = mongoose.model('Goal', goalSchema);
