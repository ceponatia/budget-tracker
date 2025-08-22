import { describe, it, expect } from 'vitest';
import {
  TransactionsSyncService,
  InMemoryTransactionRepository,
  TransactionsQueryService,
} from '../index.js';
import { asAccountId } from '@budget/domain';
import {
  createMockAdapter,
  type ProviderAdapter,
  type TransactionsSyncPage,
} from '@budget/provider';

function makePagedAdapter(): ProviderAdapter {
  const base = createMockAdapter();
  return {
    ...base,
    async syncTransactions(_accessToken: string, cursor?: string): Promise<TransactionsSyncPage> {
      if (!cursor) {
        return {
          added: [
            {
              id: 't1',
              accountId: 'acc1',
              postedAt: '2025-01-01',
              description: 'Coffee',
              amount: 450,
              currency: 'USD',
              pending: false,
              category: ['Food'],
            },
          ],
          modified: [],
          removed: [],
          nextCursor: 'cursor2',
          hasMore: true,
        };
      }
      return {
        added: [],
        modified: [
          {
            id: 't1',
            accountId: 'acc1',
            postedAt: '2025-01-01',
            description: 'Coffee (adjusted)',
            amount: 450,
            currency: 'USD',
            pending: false,
            category: ['Food'],
          },
        ],
        removed: [],
        hasMore: false,
      };
    },
  };
}

describe('TransactionsSyncService', () => {
  it('handles multi page sync and categorization fallback', async () => {
    const repo = new InMemoryTransactionRepository();
    const svc = new TransactionsSyncService({
      provider: makePagedAdapter(),
      repo,
      now: () => new Date('2025-02-01T00:00:00Z'),
      categorize: (r) => r.category ?? ['Uncategorized'],
    });
    const res = await svc.fullSync('mock-access');
    expect(res.added).toBe(1);
    expect(res.modified).toBe(1); // second page modifies the same transaction id
    const list = await repo.listByAccount('acc1');
    expect(list.length).toBe(1);
    expect(list[0]?.description).toContain('adjusted');
    expect(list[0]?.category).toEqual(['Food']);
  });
});

describe('TransactionsQueryService', () => {
  it('paginates and filters', async () => {
    const repo = new InMemoryTransactionRepository();
    // seed 3 transactions
    const acc = asAccountId('acc1');
    await repo.upsertMany([
      {
        id: 'a',
        accountId: acc,
        postedAt: '2025-01-03',
        description: 'T3',
        amount: 300,
        currency: 'USD',
        pending: false,
      },
      {
        id: 'b',
        accountId: acc,
        postedAt: '2025-01-02',
        description: 'T2',
        amount: 200,
        currency: 'USD',
        pending: false,
        category: ['Food'],
      },
      {
        id: 'c',
        accountId: acc,
        postedAt: '2025-01-01',
        description: 'T1',
        amount: 100,
        currency: 'USD',
        pending: false,
      },
    ]);
    const q = new TransactionsQueryService(repo);
    const page1 = await q.list({ accountId: 'acc1', limit: 2 });
    expect(page1.items.length).toBe(2);
    expect(page1.nextCursor).toBeDefined();
    const page2 = await q.list({ accountId: 'acc1', cursor: page1.nextCursor });
    expect(page2.items.length).toBe(1);
    const filtered = await q.list({ accountId: 'acc1', category: 'Food' });
    expect(filtered.items.length).toBe(1);
    expect(filtered.items[0]?.id).toBe('b');
  });
});
