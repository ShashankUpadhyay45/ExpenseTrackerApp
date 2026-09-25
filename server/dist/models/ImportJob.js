import mongoose from 'mongoose';
const importJobSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    fileType: { type: String, enum: ['csv', 'json'], required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    totalRows: { type: Number, default: 0 },
    importedRows: { type: Number, default: 0 },
    skippedRows: { type: Number, default: 0 },
    errors: [{ row: Number, message: String }],
    columnMapping: { type: Map, of: String },
    duplicatesFound: { type: Number, default: 0 },
    completedAt: { type: Date }
}, { timestamps: { createdAt: true, updatedAt: false } });
importJobSchema.index({ userId: 1 });
export const ImportJob = mongoose.model('ImportJob', importJobSchema);
