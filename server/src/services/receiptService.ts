import { Receipt } from '../models/Receipt.js';
import { AppError } from '../utils/AppError.js';
import fs from 'fs';
import path from 'path';

export const receiptService = {
  processReceipt: async (userId: string, file: Express.Multer.File) => {
    if (!file) throw new AppError('No receipt image file provided', 400);

    const imagePath = file.path;
    let ocrText = '';
    let extractedAmount = 0;
    let extractedDate = new Date();
    let extractedMerchant = '';
    let confidence = 0.5;

    try {
      // Lazy load tesseract to avoid slow startup
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const ret = await worker.recognize(imagePath);
      ocrText = ret.data.text;
      confidence = (ret.data.confidence || 50) / 100;
      await worker.terminate();

      // Extract amount using regex
      const amountMatches = ocrText.match(/(?:total|amount|due|subtotal|balance|pay)?\s*[$₹€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2}))/i);
      if (amountMatches && amountMatches[1]) {
        extractedAmount = parseFloat(amountMatches[1].replace(/,/g, ''));
      } else {
        // Fallback: look for largest floating point number
        const allFloats = ocrText.match(/\d+\.\d{2}/g);
        if (allFloats && allFloats.length > 0) {
          const numbers = allFloats.map(n => parseFloat(n));
          extractedAmount = Math.max(...numbers);
        }
      }

      // Extract Merchant (first non-empty line usually)
      const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      if (lines.length > 0) {
        extractedMerchant = lines[0].slice(0, 50);
      }

      // Extract Date
      const dateMatches = ocrText.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(\d{4}[/-]\d{1,2}[/-]\d{1,2})/);
      if (dateMatches) {
        const parsed = new Date(dateMatches[0]);
        if (!isNaN(parsed.getTime())) extractedDate = parsed;
      }
    } catch (err: any) {
      console.warn('OCR processing error (using basic extraction):', err.message);
      ocrText = 'OCR processing was unavailable or image was blurry.';
      confidence = 0.2;
    }

    const receipt = await Receipt.create({
      userId,
      imagePath,
      ocrText,
      extractedData: {
        merchant: extractedMerchant || 'Receipt Merchant',
        amount: extractedAmount,
        date: extractedDate,
        tax: 0,
        lineItems: []
      },
      confidence: Math.round(confidence * 100) / 100,
      status: extractedAmount > 0 ? 'completed' : 'processing'
    });

    return receipt;
  },

  getById: async (userId: string, id: string) => {
    const receipt = await Receipt.findOne({ _id: id, userId });
    if (!receipt) throw new AppError('Receipt not found', 404);
    return receipt;
  },

  delete: async (userId: string, id: string) => {
    const receipt = await Receipt.findOneAndDelete({ _id: id, userId });
    if (!receipt) throw new AppError('Receipt not found', 404);
    if (receipt.imagePath && fs.existsSync(receipt.imagePath)) {
      try { fs.unlinkSync(receipt.imagePath); } catch (e) {}
    }
    return { message: 'Receipt deleted successfully' };
  }
};