import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  imagePath: { type: String, required: true },
  ocrText: { type: String },
  extractedData: {
    merchant: String,
    amount: Number,
    date: Date,
    tax: Number,
    lineItems: [{ description: String, amount: Number }]
  },
  confidence: { type: Number },
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
  createdAt: { type: Date, default: Date.now }
});

receiptSchema.index({ userId: 1 });

export const Receipt = mongoose.model('Receipt', receiptSchema);
