import multer from 'multer';
import { AppError } from '../utils/AppError.js';
import path from 'path';
import fs from 'fs';

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const receiptFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new AppError('Please upload an image receipt (JPEG/PNG/WebP/PDF).', 400), false);
  }
};

const docFilter = (req: any, file: any, cb: any) => {
  if (
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/json' ||
    file.originalname.endsWith('.csv') ||
    file.originalname.endsWith('.json') ||
    file.mimetype === 'application/vnd.ms-excel'
  ) {
    cb(null, true);
  } else {
    cb(new AppError('Please upload a valid CSV or JSON file.', 400), false);
  }
};

export const upload = multer({ storage });
export const uploadReceipt = multer({
  storage,
  fileFilter: receiptFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});
export const uploadCSV = multer({
  storage,
  fileFilter: docFilter,
  limits: { fileSize: 25 * 1024 * 1024 }
});
