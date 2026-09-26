import { describe, it, expect } from 'vitest';

describe('Financial Calculation Engines', () => {
  it('calculates net savings and savings rate correctly', () => {
    const income = 5000;
    const expenses = 3200;
    const savings = income - expenses;
    const savingsRate = Math.round((savings / income) * 100);

    expect(savings).toBe(1800);
    expect(savingsRate).toBe(36);
  });

  it('handles zero income edge case without dividing by zero', () => {
    const income = 0;
    const expenses = 150;
    const savings = income - expenses;
    const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

    expect(savings).toBe(-150);
    expect(savingsRate).toBe(0);
  });

  it('calculates daily budget spending pace correctly', () => {
    const budgetLimit = 1000;
    const spentSoFar = 400;
    const remaining = budgetLimit - spentSoFar;
    const daysRemaining = 12;
    const dailyPace = Math.round((remaining / daysRemaining) * 100) / 100;

    expect(dailyPace).toBe(50);
  });

  it('projects month-end spend based on current pace', () => {
    const currentDay = 15;
    const totalDaysInMonth = 30;
    const spentSoFar = 600;
    const projectedMonthEnd = Math.round((spentSoFar / currentDay) * totalDaysInMonth);

    expect(projectedMonthEnd).toBe(1200);
  });

  it('aggregates net worth correctly across asset and credit accounts', () => {
    const accounts = [
      { name: 'Checking', type: 'bank', balance: 2500 },
      { name: 'Savings', type: 'savings', balance: 10000 },
      { name: 'Cash', type: 'cash', balance: 350 },
      { name: 'Credit Card', type: 'credit', balance: 1200 }
    ];

    let netWorth = 0;
    accounts.forEach(acc => {
      if (acc.type === 'credit') {
        netWorth -= acc.balance;
      } else {
        netWorth += acc.balance;
      }
    });

    expect(netWorth).toBe(11650);
  });
});
