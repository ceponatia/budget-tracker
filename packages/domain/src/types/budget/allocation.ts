/**
 * Allocation domain type (T-032)
 * Associates a Category with an amount for a given BudgetPeriod.
 */
import type { BudgetPeriodId } from './budget-period.js';
import type { CategoryId } from './category.js';

export interface AllocationIdBrand {
  readonly __brand: unique symbol;
}
export type AllocationId = string & AllocationIdBrand;

export interface Allocation {
  id: AllocationId;
  periodId: BudgetPeriodId;
  categoryId: CategoryId;
  amount: number; // planned amount (minor units)
  currency: string; // ISO currency code
  createdAt: string;
  modifiedAt?: string;
}
