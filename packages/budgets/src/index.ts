/**
 * Budgets module (T-033)
 * Provides creation service for categories, budget periods, and allocations.
 * Persistence is in-memory placeholder until real DB layer added.
 */
import type {
  Category,
  CategoryId,
  BudgetPeriod,
  BudgetPeriodId,
  Allocation,
  AllocationId,
} from '@budget/domain';
// Re-export types (now using workspace alias)
export type { Category, CategoryId, BudgetPeriod, BudgetPeriodId, Allocation, AllocationId };

// In-memory stores (simple arrays) - not exported directly to encourage service usage
interface Stores {
  categories: Category[];
  periods: BudgetPeriod[];
  allocations: Allocation[];
}

export class InMemoryBudgetsRepository {
  private stores: Stores = { categories: [], periods: [], allocations: [] };

  createCategory(
    input: Omit<Category, 'id' | 'createdAt'> & { id: CategoryId; createdAt?: string },
  ): Category {
    const cat: Category = { ...input, createdAt: input.createdAt ?? new Date().toISOString() };
    this.stores.categories.push(cat);
    return cat;
  }
  listCategories(groupId: string): Category[] {
    return this.stores.categories.filter((c) => c.groupId === groupId && !c.archivedAt);
  }
  createPeriod(
    input: Omit<BudgetPeriod, 'createdAt' | 'type'> & {
      id: BudgetPeriodId;
      createdAt?: string;
      type?: BudgetPeriod['type'];
    },
  ): BudgetPeriod {
    const period: BudgetPeriod = {
      ...input,
      type: input.type ?? 'MONTH',
      createdAt: input.createdAt ?? new Date().toISOString(),
    };
    this.stores.periods.push(period);
    return period;
  }
  createAllocation(
    input: Omit<Allocation, 'createdAt'> & { id: AllocationId; createdAt?: string },
  ): Allocation {
    const alloc: Allocation = { ...input, createdAt: input.createdAt ?? new Date().toISOString() };
    this.stores.allocations.push(alloc);
    return alloc;
  }
  listAllocations(periodId: BudgetPeriodId): Allocation[] {
    return this.stores.allocations.filter((a) => a.periodId === periodId);
  }
  getCategory(id: CategoryId): Category | undefined {
    return this.stores.categories.find((c) => c.id === id);
  }
  getPeriod(id: BudgetPeriodId): BudgetPeriod | undefined {
    return this.stores.periods.find((p) => p.id === id);
  }
}

// Simple id factory (placeholder – replace with UUIDv7 util in later task T-054)
let seq = 0;
function newId(prefix: string): string {
  seq += 1;
  return `${prefix}_${seq.toString(36)}`;
}

export interface BudgetsServiceDeps {
  repo: InMemoryBudgetsRepository;
  now?: () => Date;
}
export class BudgetsService {
  constructor(private deps: BudgetsServiceDeps) {}

  createCategory(params: { groupId: string; name: string }): Category {
    return this.deps.repo.createCategory({
      id: newId('cat') as CategoryId,
      groupId: params.groupId,
      name: params.name,
    });
  }
  createPeriod(params: { groupId: string; startDate: string }): BudgetPeriod {
    return this.deps.repo.createPeriod({
      id: newId('per') as BudgetPeriodId,
      groupId: params.groupId,
      startDate: params.startDate,
    });
  }
  createAllocation(params: {
    periodId: BudgetPeriodId;
    categoryId: CategoryId;
    amount: number;
    currency: string;
  }): Allocation {
    return this.deps.repo.createAllocation({ id: newId('alloc') as AllocationId, ...params });
  }
  listCategories(groupId: string): Category[] {
    return this.deps.repo.listCategories(groupId);
  }
  listAllocations(periodId: BudgetPeriodId): Allocation[] {
    return this.deps.repo.listAllocations(periodId);
  }
  getPeriod(id: BudgetPeriodId): BudgetPeriod | undefined {
    return this.deps.repo.getPeriod(id);
  }
}

// Budget computation service (T-034)
export interface BudgetComputationDeps {
  budgets: BudgetsService;
  // Transaction accessor: returns transactions for a group & (optionally) period date constraint
  listGroupTransactions(
    groupId: string,
  ): Promise<readonly { amount: number; category?: string[] | null; postedAt: string }[]>;
}

export interface CategoryBudgetView {
  categoryId: CategoryId;
  name: string;
  allocationMinorUnits: number; // planned
  spentMinorUnits: number; // sum of matching transactions (negative amounts treated absolute? assume expenses are positive already)
  remainingMinorUnits: number; // allocation - spent
  currency: string;
}
export interface PeriodBudgetView {
  periodId: BudgetPeriodId;
  groupId: string;
  startDate: string;
  type: 'MONTH';
  categories: CategoryBudgetView[];
  totals: { allocated: number; spent: number; remaining: number; currency: string };
}

export class BudgetComputationService {
  constructor(private deps: BudgetComputationDeps) {}

  async computePeriodBudget(params: {
    groupId: string;
    periodId: BudgetPeriodId;
  }): Promise<PeriodBudgetView> {
    const { groupId, periodId } = params;
    // Use explicit accessor instead of reaching into private deps
    const period = this.deps.budgets.getPeriod(periodId);
    if (!period || period.groupId !== groupId) throw new Error('PERIOD_NOT_FOUND');
    const allocations = this.deps.budgets.listAllocations(periodId);
    const categories = this.deps.budgets.listCategories(groupId);
    const txs = await this.deps.listGroupTransactions(groupId);
    // For simplicity: include all transactions whose postedAt month matches period.startDate (YYYY-MM segment)
    const periodMonth = period.startDate.slice(0, 7);
    const periodTx = txs.filter((t) => t.postedAt.startsWith(periodMonth));

    const byCategorySpent = new Map<CategoryId, number>();
    // Build name->id map once (efficient & deterministic)
    const nameToId = new Map<string, CategoryId>(categories.map((c) => [c.name, c.id]));
    for (const t of periodTx) {
      const catName = t.category?.[0];
      if (!catName) continue;
      const catId = nameToId.get(catName);
      if (!catId) continue; // unmatched provider category name
      const prev = byCategorySpent.get(catId) ?? 0;
      byCategorySpent.set(catId, prev + t.amount);
    }
    const categoryViews: CategoryBudgetView[] = allocations.map((a) => {
      const cat = categories.find((c) => c.id === a.categoryId);
      const spent = byCategorySpent.get(a.categoryId) ?? 0;
      const remaining = a.amount - spent;
      return {
        categoryId: a.categoryId,
        name: cat?.name ?? 'Unknown',
        allocationMinorUnits: a.amount,
        spentMinorUnits: spent,
        remainingMinorUnits: remaining,
        currency: a.currency,
      };
    });
    const currency = categoryViews[0]?.currency ?? 'USD';
    const allocated = categoryViews.reduce((s, v) => s + v.allocationMinorUnits, 0);
    const spent = categoryViews.reduce((s, v) => s + v.spentMinorUnits, 0);
    const remaining = allocated - spent;
    return {
      periodId: period.id,
      groupId: period.groupId,
      startDate: period.startDate,
      type: period.type,
      categories: categoryViews,
      totals: { allocated, spent, remaining, currency },
    };
  }
}

// Helper brand casting utilities (compile-time only). Runtime validation deferred to later tasks.
export function asBudgetPeriodId(value: string): BudgetPeriodId {
  return value as BudgetPeriodId;
}
export function asCategoryId(value: string): CategoryId {
  return value as CategoryId;
}
