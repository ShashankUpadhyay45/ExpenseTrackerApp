import mongoose from 'mongoose';
const aiInsightSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['summary', 'categorization', 'anomaly', 'forecast', 'whatif', 'query'], required: true },
    prompt: { type: String },
    response: { type: String, required: true },
    dataContext: { type: mongoose.Schema.Types.Mixed },
    isStale: { type: Boolean, default: false },
    expiresAt: { type: Date }
}, { timestamps: { createdAt: true, updatedAt: false } });
aiInsightSchema.index({ userId: 1, type: 1 });
export const AIInsight = mongoose.model('AIInsight', aiInsightSchema);
