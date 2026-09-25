import { v4 as uuidv4 } from 'uuid';

export const generateId = () => uuidv4();

export const paginate = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit };
};

export const sanitizeQuery = (query: Record<string, any>) => {
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  const queryObj = { ...query };
  excludedFields.forEach((el) => delete queryObj[el]);

  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
  return JSON.parse(queryStr);
};

export const buildDateFilter = (startDate?: string, endDate?: string) => {
  if (startDate && endDate) {
    return {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  return undefined;
};

export const calculatePercentage = (part: number, total: number) => {
  if (total === 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
};
