import { describe, it, expect } from 'vitest';
import {
  InMemoryBudgetsRepository,
  BudgetsService,
  BudgetComputationService,
  asBudgetPeriodId,
} from '../index.js';

describe('budgets smoke', () => {
  it('creates category, period, allocation and computes budget', async () => {
    const repo = new InMemoryBudgetsRepository();
    const service = new BudgetsService({ repo });
    const compute = new BudgetComputationService({
      budgets: service,
      listGroupTransactions: async () => [],
    });
    const cat = service.createCategory({ groupId: 'g1', name: 'Food' });
    const period = service.createPeriod({ groupId: 'g1', startDate: '2025-08-01' });
    service.createAllocation({
      periodId: asBudgetPeriodId(period.id),
      categoryId: cat.id,
      amount: 10000,
      currency: 'USD',
    });
    const view = await compute.computePeriodBudget({
      groupId: 'g1',
      periodId: asBudgetPeriodId(period.id),
    });
    expect(view.categories.length).toBe(1);
    const first = view.categories[0];
    expect(first).toBeDefined();
    if (first) expect(first.allocationMinorUnits).toBe(10000);
  });
});
