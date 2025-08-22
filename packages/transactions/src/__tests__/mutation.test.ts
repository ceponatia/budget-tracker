import { describe, it, expect } from 'vitest';
import { InMemoryTransactionRepository, TransactionsMutationService } from '../index.js';
import { asAccountId } from '@budget/domain';

describe('TransactionsMutationService', () => {
  it('updates category for existing transaction (T-031)', async () => {
    const repo = new InMemoryTransactionRepository();
    const accountId = asAccountId('accX');
    await repo.upsertMany([
      {
        id: 'tx1',
        accountId,
        postedAt: '2025-01-01',
        description: 'Test',
        amount: 1000,
        currency: 'USD',
        pending: false,
        category: ['Old'],
      },
    ]);
    const mut = new TransactionsMutationService(repo);
    const res = await mut.setCategory({
      transactionId: 'tx1',
      accountId: accountId,
      category: 'Food',
    });
    expect(res.updated).toBeDefined();
    expect(res.updated?.category).toEqual(['Food']);
  });
  it('returns undefined when transaction missing', async () => {
    const repo = new InMemoryTransactionRepository();
    const mut = new TransactionsMutationService(repo);
    const res = await mut.setCategory({
      transactionId: 'nope',
      accountId: asAccountId('accY'),
      category: 'Misc',
    });
    expect(res.updated).toBeUndefined();
  });
});
