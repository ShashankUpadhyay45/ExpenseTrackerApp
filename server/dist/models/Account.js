import mongoose from 'mongoose';
const accountSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['cash', 'bank', 'wallet', 'debit', 'credit', 'savings'], required: true },
    balance: { type: Number, default: 0 },
    openingBalance: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    creditLimit: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    icon: { type: String },
    color: { type: String }
}, { timestamps: true });
accountSchema.index({ userId: 1 });
accountSchema.index({ userId: 1, type: 1 });
export const Account = mongoose.model('Account', accountSchema);
