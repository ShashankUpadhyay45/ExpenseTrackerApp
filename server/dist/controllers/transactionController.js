import { transactionService } from '../services/transactionService.js';
import { successResponse } from '../utils/apiResponse.js';
export const createTransaction = async (req, res) => {
    const result = await transactionService.create({ ...req.body, userId: req.user.id });
    successResponse(res, result, 'Transaction created successfully');
};
export const getTransactions = async (req, res) => {
    const result = await transactionService.getAll({ userId: req.user.id });
    successResponse(res, result, 'Transactions fetched successfully');
};
