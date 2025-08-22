/**
 * BudgetPeriod domain type (T-032)
 * Defines a time range (typically monthly) against which allocations apply.
 */
export interface BudgetPeriodIdBrand {
  readonly __brand: unique symbol;
}
export type BudgetPeriodId = string & BudgetPeriodIdBrand;

export interface BudgetPeriod {
  id: BudgetPeriodId;
  groupId: string;
  // Inclusive period start (YYYY-MM-DD)
  startDate: string;
  type: 'MONTH';
  createdAt: string;
}
