/**
 * Transactions sync service (T-027)
 * Handles paged provider sync results and builds a consolidated list (in-memory placeholder persistence).
 */
import { Transaction, asAccountId } from '@budget/domain';
import type { ProviderAdapter, TransactionsSyncPage, TransactionRecord } from '@budget/provider';

export interface TransactionRepository {
  upsertMany(records: Transaction[]): Promise<void>;
  listByAccount(accountId: string): Promise<Transaction[]>;
  updateCategory(
    transactionId: string,
    accountId: string,
    category: string[],
  ): Promise<Transaction | undefined>;
}

export class InMemoryTransactionRepository implements TransactionRepository {
  private byAccount = new Map<string, Transaction[]>();
  async upsertMany(records: Transaction[]): Promise<void> {
    for (const r of records) {
      const list = this.byAccount.get(r.accountId) ?? [];
      const idx = list.findIndex((t) => t.id === r.id);
      if (idx >= 0) list[idx] = r;
      else list.push(r);
      this.byAccount.set(r.accountId, list);
    }
  }
  async listByAccount(accountId: string): Promise<Transaction[]> {
    return (this.byAccount.get(accountId) ?? []).slice();
  }
  async updateCategory(
    transactionId: string,
    accountId: string,
    category: string[],
  ): Promise<Transaction | undefined> {
    const list = this.byAccount.get(accountId);
    if (!list) return undefined;
    const idx = list.findIndex((t) => t.id === transactionId);
    if (idx === -1) return undefined;
    const existing = list[idx];
    if (!existing) return undefined;
    const updated: Transaction = {
      id: existing.id,
      accountId: existing.accountId,
      postedAt: existing.postedAt,
      description: existing.description,
      amount: existing.amount,
      currency: existing.currency,
      pending: existing.pending,
      modifiedAt: existing.modifiedAt,
      removed: existing.removed,
      category,
    };
    list[idx] = updated;
    this.byAccount.set(accountId, list);
    return updated;
  }
}

export interface TransactionsSyncServiceDeps {
  provider: ProviderAdapter;
  repo: TransactionRepository;
  now(): Date;
  categorize?(record: TransactionRecord): string[] | undefined; // placeholder auto-categorization (T-030)
}

export class TransactionsSyncService {
  constructor(private deps: TransactionsSyncServiceDeps) {}
  async fullSync(
    accessToken: string,
  ): Promise<{ added: number; modified: number; removed: number }> {
    let cursor: string | undefined;
    let totalAdded = 0;
    let totalModified = 0;
    let totalRemoved = 0;
    let hasMore = true;
    while (hasMore) {
      const page: TransactionsSyncPage = await this.deps.provider.syncTransactions(
        accessToken,
        cursor,
      );
      const nowIso = this.deps.now().toISOString();
      const toUpsert: Transaction[] = [
        ...page.added.map((t) => ({
          id: t.id,
          accountId: asAccountId(t.accountId),
          postedAt: t.postedAt,
          description: t.description,
          amount: t.amount,
          currency: t.currency,
          pending: t.pending,
          category: this.deps.categorize?.(t) ?? t.category ?? ['Uncategorized'],
          modifiedAt: nowIso,
        })),
        ...page.modified.map((t) => ({
          id: t.id,
          accountId: asAccountId(t.accountId),
          postedAt: t.postedAt,
          description: t.description,
          amount: t.amount,
          currency: t.currency,
          pending: t.pending,
          category: this.deps.categorize?.(t) ?? t.category ?? ['Uncategorized'],
          modifiedAt: nowIso,
        })),
      ];
      await this.deps.repo.upsertMany(toUpsert);
      totalAdded += page.added.length;
      totalModified += page.modified.length;
      totalRemoved += page.removed.length;
      cursor = page.nextCursor;
      hasMore = page.hasMore;
    }
    return { added: totalAdded, modified: totalModified, removed: totalRemoved };
  }
}

export interface ListTransactionsParams {
  accountId: string;
  limit?: number; // default 50
  cursor?: string; // opaque index position (stringified number)
  minAmount?: number;
  maxAmount?: number;
  category?: string; // matches any category element
}
export interface ListTransactionsResult {
  items: Transaction[];
  nextCursor?: string;
}

export class TransactionsQueryService {
  constructor(private repo: TransactionRepository) {}
  async list(params: ListTransactionsParams): Promise<ListTransactionsResult> {
    const all = (await this.repo.listByAccount(params.accountId)).sort(
      (a, b) => b.postedAt.localeCompare(a.postedAt) || b.id.localeCompare(a.id),
    );
    const start = params.cursor ? Number(params.cursor) : 0;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 50;
    const filtered = all.filter((t) => {
      if (params.minAmount !== undefined && t.amount < params.minAmount) return false;
      if (params.maxAmount !== undefined && t.amount > params.maxAmount) return false;
      if (params.category && !(t.category ?? []).includes(params.category)) return false;
      return true;
    });
    const slice = filtered.slice(start, start + limit);
    const next = start + limit < filtered.length ? String(start + limit) : undefined;
    return { items: slice, nextCursor: next };
  }
}

// Mutation service for manual edits (T-031)
export interface SetTransactionCategoryParams {
  transactionId: string;
  accountId: string;
  category: string;
}
export class TransactionsMutationService {
  constructor(private repo: TransactionRepository) {}
  async setCategory(params: SetTransactionCategoryParams): Promise<{ updated?: Transaction }> {
    const catArray = [params.category];
    const updated = await this.repo.updateCategory(
      params.transactionId,
      params.accountId,
      catArray,
    );
    return { updated };
  }
}
