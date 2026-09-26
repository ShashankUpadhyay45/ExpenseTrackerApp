import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from './models/User.js';
import { Account } from './models/Account.js';
import { Transaction } from './models/Transaction.js';
import { Budget } from './models/Budget.js';
import { Bill } from './models/Bill.js';
import { Goal } from './models/Goal.js';
import { Notification } from './models/Notification.js';
import { UserPreference } from './models/UserPreference.js';
import { Category } from './models/Category.js';

async function seedData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in environment.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(uri);
  console.log('Connected! Seeding Indian demo account in Rupees (₹)...');

  // We support both demo@spendsage.com and aarav@spendsage.com
  const emailsToSeed = ['demo@spendsage.com', 'aarav@spendsage.com'];

  for (const email of emailsToSeed) {
    let user = await User.findOne({ email });

    if (user) {
      console.log(`Cleaning existing data for ${email}...`);
      const userId = user._id;
      await Promise.all([
        Account.deleteMany({ userId }),
        Transaction.deleteMany({ userId }),
        Budget.deleteMany({ userId }),
        Bill.deleteMany({ userId }),
        Goal.deleteMany({ userId }),
        Notification.deleteMany({ userId }),
        Category.deleteMany({ userId }),
        UserPreference.deleteOne({ userId }),
        User.deleteOne({ _id: userId })
      ]);
    }

    user = await User.create({
      email,
      password: 'Password123!',
      firstName: 'Aarav',
      lastName: 'Sharma',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      isEmailVerified: true
    });

    const userId = user._id;
    console.log(`Created Indian Demo User: ${email} (Aarav Sharma) with ID: ${userId}`);

    // Preferences: INR Currency
    await UserPreference.create({
      userId,
      currency: 'INR',
      locale: 'en-IN',
      dateFormat: 'DD/MM/YYYY',
      theme: 'light'
    });

    // Categories
    await Category.insertMany([
      { userId, name: 'Salary', type: 'income' },
      { userId, name: 'Consulting', type: 'income' },
      { userId, name: 'Dividends', type: 'income' },
      { userId, name: 'Food & Dining', type: 'expense' },
      { userId, name: 'Groceries', type: 'expense' },
      { userId, name: 'House Rent', type: 'expense' },
      { userId, name: 'Bills & Utilities', type: 'expense' },
      { userId, name: 'Transport & Fuel', type: 'expense' },
      { userId, name: 'Shopping', type: 'expense' },
      { userId, name: 'Entertainment', type: 'expense' },
      { userId, name: 'Health & Medical', type: 'expense' },
      { userId, name: 'Investments', type: 'expense' }
    ]);

    // Accounts in INR
    const hdfc = await Account.create({
      userId,
      name: 'HDFC Salary Checking',
      type: 'bank',
      balance: 95400.00,
      openingBalance: 50000.00,
      isDefault: true,
      currency: 'INR'
    });

    const icici = await Account.create({
      userId,
      name: 'ICICI Wealth Savings',
      type: 'savings',
      balance: 420000.00,
      openingBalance: 300000.00,
      isDefault: false,
      currency: 'INR'
    });

    const regalia = await Account.create({
      userId,
      name: 'HDFC Regalia Gold Credit Card',
      type: 'credit',
      balance: 24500.00,
      creditLimit: 300000.00,
      isDefault: false,
      currency: 'INR'
    });

    const paytm = await Account.create({
      userId,
      name: 'Paytm / UPI Wallet',
      type: 'wallet',
      balance: 6850.00,
      openingBalance: 3000.00,
      isDefault: false,
      currency: 'INR'
    });

    const cashWallet = await Account.create({
      userId,
      name: 'Cash in Hand',
      type: 'cash',
      balance: 8500.00,
      openingBalance: 5000.00,
      isDefault: false,
      currency: 'INR'
    });

    // Budgets in INR
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    await Budget.insertMany([
      {
        userId,
        category: 'Food & Dining',
        amount: 20000,
        spent: 12450,
        period: 'monthly',
        startDate: startMonth,
        endDate: endMonth,
        alertThreshold: 80
      },
      {
        userId,
        category: 'Groceries',
        amount: 18000,
        spent: 14200,
        period: 'monthly',
        startDate: startMonth,
        endDate: endMonth,
        alertThreshold: 80
      },
      {
        userId,
        category: 'Shopping',
        amount: 15000,
        spent: 16800, // 112% Over budget alert!
        period: 'monthly',
        startDate: startMonth,
        endDate: endMonth,
        alertThreshold: 80
      },
      {
        userId,
        category: 'Transport & Fuel',
        amount: 10000,
        spent: 5600,
        period: 'monthly',
        startDate: startMonth,
        endDate: endMonth,
        alertThreshold: 80
      },
      {
        userId,
        category: 'Entertainment',
        amount: 8000,
        spent: 4200,
        period: 'monthly',
        startDate: startMonth,
        endDate: endMonth,
        alertThreshold: 80
      },
      {
        userId,
        category: 'Bills & Utilities',
        amount: 38000,
        spent: 35179,
        period: 'monthly',
        startDate: startMonth,
        endDate: endMonth,
        alertThreshold: 80
      }
    ]);

    // Recurring Bills
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const in10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const overdue2Days = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    await Bill.insertMany([
      {
        userId,
        name: 'Airtel Xstream Fiber WiFi',
        amount: 1179.00,
        frequency: 'monthly',
        dueDate: in3Days,
        nextDueDate: in3Days,
        category: 'Bills & Utilities',
        merchant: 'Airtel Broadband',
        isPaid: false
      },
      {
        userId,
        name: '2BHK Apartment Rent',
        amount: 32000.00,
        frequency: 'monthly',
        dueDate: in5Days,
        nextDueDate: in5Days,
        category: 'House Rent',
        merchant: 'Apartment Owner',
        isPaid: false
      },
      {
        userId,
        name: 'Tata Power Electricity Bill',
        amount: 2450.00,
        frequency: 'monthly',
        dueDate: in10Days,
        nextDueDate: in10Days,
        category: 'Bills & Utilities',
        merchant: 'Tata Power DDL',
        isPaid: false
      },
      {
        userId,
        name: 'Municipal Jal Board Water Bill',
        amount: 650.00,
        frequency: 'monthly',
        dueDate: overdue2Days,
        nextDueDate: overdue2Days,
        category: 'Bills & Utilities',
        merchant: 'Delhi Jal Board',
        isPaid: false // Overdue!
      },
      {
        userId,
        name: 'Cult.fit Gym & Fitness Pass',
        amount: 1499.00,
        frequency: 'monthly',
        dueDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        nextDueDate: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
        category: 'Health & Medical',
        merchant: 'Cult.fit',
        isPaid: true
      },
      {
        userId,
        name: 'Netflix & Spotify Family Premium',
        amount: 849.00,
        frequency: 'monthly',
        dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        nextDueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
        category: 'Entertainment',
        merchant: 'Digital Subscriptions',
        isPaid: true
      }
    ]);

    // Savings Goals in INR
    await Goal.insertMany([
      {
        userId,
        name: 'Emergency Rainy-Day Reserve',
        targetAmount: 500000,
        currentAmount: 380000,
        targetDate: new Date(now.getFullYear(), now.getMonth() + 4, 1),
        priority: 'high',
        status: 'active',
        contributions: [
          { amount: 150000, note: 'Initial Corpus', date: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
          { amount: 130000, note: 'Annual Bonus', date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) },
          { amount: 100000, note: 'Monthly Savings', date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) }
        ]
      },
      {
        userId,
        name: 'Ladakh Bike Expedition 2027',
        targetAmount: 85000,
        currentAmount: 55000,
        targetDate: new Date(now.getFullYear() + 1, 5, 1),
        priority: 'medium',
        status: 'active',
        contributions: [
          { amount: 30000, note: 'Riding Gear Savings', date: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000) },
          { amount: 25000, note: 'Trip Stash', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) }
        ]
      },
      {
        userId,
        name: 'Apple MacBook Pro M3 Workstation',
        targetAmount: 185000,
        currentAmount: 185000,
        targetDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        priority: 'high',
        status: 'completed', // Shows in Trophy section
        contributions: [
          { amount: 95000, note: 'Freelance App Delivery', date: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000) },
          { amount: 90000, note: 'Final Milestone Pay', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) }
        ]
      },
      {
        userId,
        name: 'Royal Enfield Himalayan Down Payment',
        targetAmount: 320000,
        currentAmount: 145000,
        targetDate: new Date(now.getFullYear() + 1, 10, 1),
        priority: 'medium',
        status: 'active',
        contributions: [
          { amount: 80000, note: 'Initial Stash', date: new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000) },
          { amount: 65000, note: 'Mutual Fund Profits', date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000) }
        ]
      }
    ]);

    // 30 Realistic Transactions in INR across 40 days
    const inrTransactions = [
      // Incomes
      { dateDaysAgo: 1, type: 'income', amount: 115000.00, category: 'Salary', description: 'Tech Mahindra Monthly Salary Deposit', merchant: 'Tech Mahindra Ltd' },
      { dateDaysAgo: 14, type: 'income', amount: 35000.00, category: 'Consulting', description: 'Fintech UI/UX Consulting Retainer', merchant: 'Razorpay Client' },
      { dateDaysAgo: 31, type: 'income', amount: 115000.00, category: 'Salary', description: 'Tech Mahindra Monthly Salary Deposit', merchant: 'Tech Mahindra Ltd' },
      { dateDaysAgo: 22, type: 'income', amount: 8500.00, category: 'Dividends', description: 'TCS & Infosys Quarterly Dividend', merchant: 'Zerodha Broking' },

      // Expenses: Food & Dining
      { dateDaysAgo: 1, type: 'expense', amount: 480.00, category: 'Food & Dining', description: 'Third Wave Coffee & Bagel', merchant: 'Third Wave Coffee Roasters' },
      { dateDaysAgo: 2, type: 'expense', amount: 1250.00, category: 'Food & Dining', description: 'Team Lunch at Punjab Grill', merchant: 'Punjab Grill' },
      { dateDaysAgo: 4, type: 'expense', amount: 340.00, category: 'Food & Dining', description: 'Zomato Biryani Order', merchant: 'Behrouz Biryani (Zomato)' },
      { dateDaysAgo: 6, type: 'expense', amount: 560.00, category: 'Food & Dining', description: 'Swiggy Dinner Delivery', merchant: 'Swiggy' },
      { dateDaysAgo: 8, type: 'expense', amount: 2850.00, category: 'Food & Dining', description: 'Weekend Family Dinner Buffet', merchant: 'Barbeque Nation' },
      { dateDaysAgo: 11, type: 'expense', amount: 420.00, category: 'Food & Dining', description: 'Starbucks Caramel Macchiato', merchant: 'Tata Starbucks' },
      { dateDaysAgo: 15, type: 'expense', amount: 780.00, category: 'Food & Dining', description: 'Haldiram Snacks & Sweets', merchant: 'Haldiram Foods' },

      // Expenses: Groceries
      { dateDaysAgo: 3, type: 'expense', amount: 3850.00, category: 'Groceries', description: 'Blinkit 10-minute grocery restock', merchant: 'Blinkit Quick' },
      { dateDaysAgo: 7, type: 'expense', amount: 4500.00, category: 'Groceries', description: 'Nature Basket Organic Supplies', merchant: 'Nature Basket' },
      { dateDaysAgo: 10, type: 'expense', amount: 2450.00, category: 'Groceries', description: 'Zepto Dairy, Fruits & Vegetables', merchant: 'Zepto Daily' },
      { dateDaysAgo: 18, type: 'expense', amount: 3400.00, category: 'Groceries', description: 'Monthly DMart Pantry Bulk Purchase', merchant: 'Avenue Supermarts (DMart)' },

      // Expenses: Shopping (Includes an unusual spike for AI Anomaly Detection)
      { dateDaysAgo: 5, type: 'expense', amount: 16800.00, category: 'Shopping', description: 'Sony WH-1000XM5 ANC Headphones', merchant: 'Croma Electronics', notes: 'Unusual gadget expense for presentations' },
      { dateDaysAgo: 9, type: 'expense', amount: 3499.00, category: 'Shopping', description: 'FabIndia Casual Kurta & Linens', merchant: 'FabIndia' },
      { dateDaysAgo: 13, type: 'expense', amount: 2850.00, category: 'Shopping', description: 'Myntra Autumn Footwear Sale', merchant: 'Myntra Designs' },
      { dateDaysAgo: 24, type: 'expense', amount: 1999.00, category: 'Shopping', description: 'Amazon Echo Dot Smart Speaker', merchant: 'Amazon India' },

      // Expenses: Transport & Fuel
      { dateDaysAgo: 2, type: 'expense', amount: 650.00, category: 'Transport & Fuel', description: 'Uber Premier ride to Airport', merchant: 'Uber India' },
      { dateDaysAgo: 5, type: 'expense', amount: 2500.00, category: 'Transport & Fuel', description: 'Shell Petrol Bunk Full Tank', merchant: 'Shell India Fuels' },
      { dateDaysAgo: 12, type: 'expense', amount: 1000.00, category: 'Transport & Fuel', description: 'Delhi Metro Smart Card Recharge', merchant: 'DMRC Metro' },
      { dateDaysAgo: 19, type: 'expense', amount: 450.00, category: 'Transport & Fuel', description: 'Ola Cab ride home from meeting', merchant: 'Ola Cabs' },

      // Expenses: Entertainment & Health
      { dateDaysAgo: 4, type: 'expense', amount: 1400.00, category: 'Entertainment', description: 'BookMyShow IMAX Movie Tickets (Kalki 2898 AD)', merchant: 'BookMyShow' },
      { dateDaysAgo: 16, type: 'expense', amount: 1499.00, category: 'Health & Medical', description: 'Cult.fit Monthly Membership', merchant: 'Cult.fit' },
      { dateDaysAgo: 10, type: 'expense', amount: 849.00, category: 'Entertainment', description: 'Netflix & Spotify Premium', merchant: 'Digital Entertainment' },
      { dateDaysAgo: 25, type: 'expense', amount: 950.00, category: 'Health & Medical', description: 'Apollo Pharmacy Vitamins & Supplements', merchant: 'Apollo Pharmacy' }
    ];

    const mappedTx = inrTransactions.map(tx => {
      const txDate = new Date(now.getTime() - tx.dateDaysAgo * 24 * 60 * 60 * 1000);
      return {
        userId,
        accountId: tx.type === 'income' ? hdfc._id : (tx.amount > 10000 ? regalia._id : hdfc._id),
        type: tx.type,
        amount: tx.amount,
        date: txDate,
        category: tx.category,
        description: tx.description,
        merchant: tx.merchant,
        notes: (tx as any).notes || undefined,
        tags: [tx.category, 'Indian Demo Data']
      };
    });

    await Transaction.insertMany(mappedTx);
    console.log(`Inserted ${mappedTx.length} INR transactions for ${email}!`);

    // Notifications
    await Notification.insertMany([
      {
        userId,
        type: 'budget_alert',
        title: 'Budget Alert: Shopping',
        message: 'You have utilized 112% of your Shopping budget (₹16,800 spent of ₹15,000 limit).',
        data: { category: 'Shopping', spent: 16800, limit: 15000 },
        isRead: false
      },
      {
        userId,
        type: 'bill_reminder',
        title: 'Upcoming Bill: 2BHK Apartment Rent',
        message: 'Rent payment of ₹32,000 is due in 5 days on ' + in5Days.toLocaleDateString('en-IN'),
        data: { amount: 32000, dueDate: in5Days },
        isRead: false
      },
      {
        userId,
        type: 'goal_milestone',
        title: '🎉 Goal Achieved: Apple MacBook Pro M3!',
        message: 'Congratulations! You successfully reached 100% of your ₹1,85,000 target.',
        data: { targetAmount: 185000 },
        isRead: true
      }
    ]);
  }

  console.log('\n======================================================');
  console.log('✨ INDIAN DEMO DATA (₹) SEEDED SUCCESSFULLY ✨');
  console.log('======================================================');
  console.log('User Name: Aarav Sharma');
  console.log('Email:     demo@spendsage.com (or aarav@spendsage.com)');
  console.log('Password:  Password123!');
  console.log('Currency:  INR (₹) with Indian Lakh formatting');
  console.log('======================================================\n');

  process.exit(0);
}

seedData().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
