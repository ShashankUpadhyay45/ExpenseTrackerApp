import { ImportJob } from '../models/ImportJob.js';
import { Transaction } from '../models/Transaction.js';
import { Account } from '../models/Account.js';
import { AppError } from '../utils/AppError.js';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

export const importService = {
  processCSV: async (userId: string, file: Express.Multer.File, mappingConfig?: any) => {
    if (!file) throw new AppError('No CSV file uploaded', 400);

    const fileContent = fs.readFileSync(file.path, 'utf-8');
    let records: any[] = [];

    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } catch (err: any) {
      throw new AppError(`Malformed CSV file: ${err.message}`, 400);
    }

    if (records.length === 0) {
      throw new AppError('CSV file contains no valid data rows', 400);
    }

    // Default account for imported transactions
    let defaultAccount = await Account.findOne({ userId, isDefault: true });
    if (!defaultAccount) {
      defaultAccount = await Account.findOne({ userId });
    }
    if (!defaultAccount) {
      defaultAccount = await Account.create({
        userId,
        name: 'Default Cash Account',
        type: 'cash',
        balance: 0,
        isDefault: true
      });
    }

    const mapping = mappingConfig || {
      date: 'date',
      description: 'description',
      category: 'category',
      amount: 'amount',
      type: 'type'
    };

    let importedCount = 0;
    let skippedCount = 0;
    const errors: any[] = [];
    const transactionsToInsert: any[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const rawDate = row[mapping.date] || row['Date'] || row['date'];
        const rawDesc = row[mapping.description] || row['Description'] || row['desc'] || 'Imported Transaction';
        const rawCat = row[mapping.category] || row['Category'] || 'Other';
        const rawAmount = row[mapping.amount] || row['Amount'] || row['amount'];
        const rawType = row[mapping.type] || row['Type'];

        const parsedAmount = parseFloat(String(rawAmount).replace(/[^0-9.-]/g, ''));
        if (isNaN(parsedAmount) || parsedAmount === 0) {
          skippedCount++;
          errors.push({ row: i + 1, message: 'Invalid or zero amount' });
          continue;
        }

        const parsedDate = new Date(rawDate);
        if (isNaN(parsedDate.getTime())) {
          skippedCount++;
          errors.push({ row: i + 1, message: 'Invalid date format' });
          continue;
        }

        const type = rawType ? rawType.toLowerCase() : (parsedAmount < 0 ? 'expense' : 'income');
        const amount = Math.abs(parsedAmount);

        transactionsToInsert.push({
          userId,
          accountId: defaultAccount._id,
          type: ['income', 'expense', 'transfer'].includes(type) ? type : 'expense',
          amount,
          date: parsedDate,
          description: rawDesc,
          category: rawCat,
          tags: ['CSV Import']
        });

        importedCount++;
      } catch (err: any) {
        skippedCount++;
        errors.push({ row: i + 1, message: err.message });
      }
    }

    if (transactionsToInsert.length > 0) {
      await Transaction.insertMany(transactionsToInsert);
      
      // Update account balance
      let netChange = 0;
      transactionsToInsert.forEach(t => {
        if (t.type === 'income') netChange += t.amount;
        if (t.type === 'expense') netChange -= t.amount;
      });
      defaultAccount.balance += netChange;
      await defaultAccount.save();
    }

    const job = await ImportJob.create({
      userId,
      filename: file.originalname,
      fileType: 'csv',
      status: 'completed',
      totalRows: records.length,
      importedRows: importedCount,
      skippedRows: skippedCount,
      errors: errors.slice(0, 50),
      completedAt: new Date()
    });

    try { fs.unlinkSync(file.path); } catch (e) {}

    return {
      jobId: job._id,
      totalRows: records.length,
      importedRows: importedCount,
      skippedRows: skippedCount,
      errorsCount: errors.length
    };
  },

  processJSON: async (userId: string, file: Express.Multer.File) => {
    if (!file) throw new AppError('No JSON backup file uploaded', 400);

    const fileContent = fs.readFileSync(file.path, 'utf-8');
    let data: any;
    try {
      data = JSON.parse(fileContent);
    } catch (e: any) {
      throw new AppError('Invalid JSON format', 400);
    }

    let defaultAccount = await Account.findOne({ userId, isDefault: true });
    if (!defaultAccount) {
      defaultAccount = await Account.create({
        userId,
        name: 'Default Cash Account',
        type: 'cash',
        balance: 0,
        isDefault: true
      });
    }

    let imported = 0;
    if (Array.isArray(data.transactions)) {
      const formatted = data.transactions.map((t: any) => ({
        ...t,
        userId,
        accountId: defaultAccount._id,
        date: new Date(t.date || Date.now())
      }));
      await Transaction.insertMany(formatted);
      imported = formatted.length;
    }

    try { fs.unlinkSync(file.path); } catch (e) {}

    return { importedTransactions: imported };
  },

  getJobStatus: async (userId: string, id: string) => {
    const job = await ImportJob.findOne({ _id: id, userId });
    if (!job) throw new AppError('Import job not found', 404);
    return job;
  }
};