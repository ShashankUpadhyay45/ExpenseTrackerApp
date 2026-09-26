import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { UserPreference } from '../models/UserPreference.js';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/index.js';
import { Category } from '../models/Category.js';

const generateAccessToken = (userId: string): string => {
  return jwt.sign({ id: userId }, config.JWT_SECRET || 'secret', { expiresIn: (config.JWT_EXPIRE || '15m') as any });
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, config.JWT_REFRESH_SECRET || 'refresh', { expiresIn: '7d' as any });
};

export const authService = {
  async register(data: any) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) throw new AppError('Email already registered', 409);
    
    const user = await User.create(data);
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    
    user.refreshTokens.push(refreshToken);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    // Create default preferences
    await UserPreference.create({ userId: user._id });
    
    // Create default categories
    await Category.insertMany([
      { userId: user._id, name: 'Salary', type: 'income' },
      { userId: user._id, name: 'Groceries', type: 'expense' },
      { userId: user._id, name: 'Rent', type: 'expense' },
      { userId: user._id, name: 'Food & Drink', type: 'expense' },
      { userId: user._id, name: 'Transport', type: 'expense' },
      { userId: user._id, name: 'Shopping', type: 'expense' },
      { userId: user._id, name: 'Bills', type: 'expense' }
    ]);
    
    const userObj: any = user.toObject();
    delete userObj.password;
    delete userObj.refreshTokens;
    
    return { user: userObj, accessToken, refreshToken };
  },
  
  async login(data: { email: string; password: string }) {
    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user || !(await user.comparePassword(data.password))) {
      throw new AppError('Invalid email or password', 401);
    }
    
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    
    user.refreshTokens.push(refreshToken);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    const userObj: any = user.toObject();
    delete userObj.password;
    delete userObj.refreshTokens;
    
    return { user: userObj, accessToken, refreshToken };
  },
  
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await User.findByIdAndUpdate(userId, {
        $pull: { refreshTokens: refreshToken }
      });
    } else {
      await User.findByIdAndUpdate(userId, {
        $set: { refreshTokens: [] }
      });
    }
  },
  
  async refreshToken(token: string) {
    if (!token) throw new AppError('Refresh token required', 400);

    let decoded: any;
    try {
      decoded = jwt.verify(token, config.JWT_REFRESH_SECRET || 'refresh') as { id: string };
    } catch (e) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(token)) {
      throw new AppError('Invalid refresh token session', 401);
    }
    
    // Rotate refresh token
    const newAccessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());
    
    user.refreshTokens = user.refreshTokens.filter((t: string) => t !== token);
    user.refreshTokens.push(newRefreshToken);
    await user.save({ validateBeforeSave: false });
    
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },
  
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new AppError('User not found', 404);
    if (!(await user.comparePassword(currentPassword))) {
      throw new AppError('Current password is incorrect', 401);
    }
    user.password = newPassword;
    user.refreshTokens = []; // Invalidate all active sessions
    await user.save();
  },
  
  async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user;
  },
  
  async updateProfile(userId: string, data: Partial<IUser>) {
    const user = await User.findByIdAndUpdate(userId, {
      firstName: data.firstName,
      lastName: data.lastName,
      avatar: data.avatar,
    }, { new: true, runValidators: true });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }
};