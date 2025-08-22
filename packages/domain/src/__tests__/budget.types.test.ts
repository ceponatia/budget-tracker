import { describe, it, expect } from 'vitest';
import { type Category, type Allocation, type BudgetPeriod } from '../index.js';

// Local helpers to brand ids without using any casts
const catId = (v: string) => v as unknown as Category['id'];
const periodId = (v: string) => v as unknown as BudgetPeriod['id'];
const allocId = (v: string) => v as unknown as Allocation['id'];

describe('Budget domain types (T-032)', () => {
  it('constructs sample category, period, allocation', () => {
    const cat: Category = {
      id: catId('cat_1'),
      name: 'Groceries',
      groupId: 'grp1',
      createdAt: new Date().toISOString(),
    };
    const period: BudgetPeriod = {
      id: periodId('per_1'),
      groupId: 'grp1',
      startDate: '2025-08-01',
      type: 'MONTH',
      createdAt: new Date().toISOString(),
    };
    const alloc: Allocation = {
      id: allocId('alloc_1'),
      periodId: period.id,
      categoryId: cat.id,
      amount: 50000,
      currency: 'USD',
      createdAt: new Date().toISOString(),
    };
    expect(cat.name).toBe('Groceries');
    expect(period.type).toBe('MONTH');
    expect(alloc.amount).toBe(50000);
  });
});
