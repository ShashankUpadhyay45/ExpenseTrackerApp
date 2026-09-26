import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

export const accountService = {
  create: async (userId: string, data: any) => {
    // If setting as default, clear other default accounts for this user
    if (data.isDefault) {
      await Account.updateMany({ userId }, { isDefault: false });
    }
    
    // Balance starts at openingBalance if not specified
    const initialBalance = data.balance !== undefined ? data.balance : (data.openingBalance || 0);
    
    const account = await Account.create({
      ...data,
      userId,
      balance: initialBalance,
      openingBalance: data.openingBalance || 0
    });
    return account;
  },

  getAll: async (userId: string) => {
    return await Account.find({ userId, isActive: true }).sort({ isDefault: -1, createdAt: -1 });
  },

  getById: async (userId: string, id: string) => {
    const account = await Account.findOne({ _id: id, userId });
    if (!account) throw new AppError('Account not found', 404);
    return account;
  },

  update: async (userId: string, id: string, data: any) => {
    if (data.isDefault) {
      await Account.updateMany({ userId, _id: { $ne: id } }, { isDefault: false });
    }
    const account = await Account.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!account) throw new AppError('Account not found', 404);
    return account;
  },

  delete: async (userId: string, id: string) => {
    // Check if account has transactions
    const transactionCount = await Transaction.countDocuments({
      userId,
      $or: [{ accountId: id }, { transferToAccountId: id }]
    });

    if (transactionCount > 0) {
      // Soft-delete if has transactions
      const account = await Account.findOneAndUpdate(
        { _id: id, userId },
        { isActive: false },
        { new: true }
      );
      if (!account) throw new AppError('Account not found', 404);
      return { message: 'Account deactivated due to existing transaction history' };
    }

    const account = await Account.findOneAndDelete({ _id: id, userId });
    if (!account) throw new AppError('Account not found', 404);
    return { message: 'Account deleted successfully' };
  },

  transfer: async (userId: string, transferData: { fromAccountId: string; toAccountId: string; amount: number; date?: string; notes?: string }) => {
    const { fromAccountId, toAccountId, amount, date = new Date().toISOString().slice(0, 10), notes = 'Account Transfer' } = transferData;

    if (fromAccountId === toAccountId) {
      throw new AppError('Cannot transfer to the same account', 400);
    }
    if (amount <= 0) {
      throw new AppError('Transfer amount must be greater than zero', 400);
    }

    const fromAccount = await Account.findOne({ _id: fromAccountId, userId });
    const toAccount = await Account.findOne({ _id: toAccountId, userId });

    if (!fromAccount || !toAccount) {
      throw new AppError('One or both accounts not found', 404);
    }

    // Deduct from source, add to destination
    fromAccount.balance -= amount;
    toAccount.balance += amount;

    await fromAccount.save();
    await toAccount.save();

    // Create a transfer transaction record
    const transferTransaction = await Transaction.create({
      userId,
      accountId: fromAccountId,
      transferToAccountId: toAccountId,
      type: 'transfer',
      amount,
      date: new Date(date),
      description: notes || `Transfer from ${fromAccount.name} to ${toAccount.name}`,
      category: 'Transfer'
    });

    return {
      transaction: transferTransaction,
      fromAccount,
      toAccount
    };
  },

  getBalanceSummary: async (userId: string) => {
    const accounts = await Account.find({ userId, isActive: true });
    
    let totalNetWorth = 0;
    let totalAssets = 0;
    let totalLiabilities = 0;
    
    const byType: Record<string, number> = {};

    accounts.forEach(acc => {
      byType[acc.type] = (byType[acc.type] || 0) + acc.balance;

      if (acc.type === 'credit') {
        totalLiabilities += Math.max(0, acc.balance);
        totalNetWorth -= acc.balance;
      } else {
        totalAssets += acc.balance;
        totalNetWorth += acc.balance;
      }
    });

    return {
      totalNetWorth,
      totalAssets,
      totalLiabilities,
      byType,
      accountCount: accounts.length
    };
  }
};