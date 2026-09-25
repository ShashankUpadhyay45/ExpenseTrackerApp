import mongoose from 'mongoose';
const categorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    icon: { type: String },
    color: { type: String },
    subcategories: [{ type: String }],
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
});
categorySchema.index({ userId: 1 });
categorySchema.index({ userId: 1, type: 1 });
export const Category = mongoose.model('Category', categorySchema);
