import { describe, it, expect } from 'vitest';
import {
  InMemoryBudgetsRepository,
  BudgetsService,
  BudgetComputationService,
  asBudgetPeriodId,
} from '../index.js';

describe('BudgetComputationService spent aggregation', () => {
  it('aggregates spent amounts by matching category name', async () => {
    const repo = new InMemoryBudgetsRepository();
    const service = new BudgetsService({ repo });
    const compute = new BudgetComputationService({
      budgets: service,
      listGroupTransactions: async () => [
        { amount: 2500, category: ['Food'], postedAt: '2025-08-05' },
        { amount: 1500, category: ['Food'], postedAt: '2025-08-10' },
        { amount: 999, category: ['Other'], postedAt: '2025-08-11' },
      ],
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
    const food = view.categories[0];
    expect(food).toBeDefined();
    if (!food) return;
    expect(food.spentMinorUnits).toBe(2500 + 1500); // only Food matched
    expect(food.remainingMinorUnits).toBe(10000 - 4000);
  });
});
