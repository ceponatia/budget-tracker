import { describe, it, expect } from 'vitest';
import { createMockAdapter, PlaidAdapter } from '../index.js';

describe('Provider mock adapter', () => {
  const adapter = createMockAdapter();

  it('creates link token with expiration ISO string', async () => {
    const lt = await adapter.createLinkToken({ userId: 'u1', groupId: 'g1' });
    expect(lt.linkToken).toBeDefined();
    expect(() => new Date(lt.expiration).toISOString()).not.toThrow();
  });

  it('exchanges public token', async () => {
    const res = await adapter.exchangePublicToken('public-mock');
    expect(res.accessToken).toContain('mock-access');
    expect(res.itemId).toBeDefined();
  });

  it('returns empty accounts array by default', async () => {
    const accounts = await adapter.getAccounts('mock-access');
    expect(Array.isArray(accounts)).toBe(true);
    expect(accounts.length).toBe(0);
  });

  it('syncTransactions returns empty page with hasMore false', async () => {
    const page = await adapter.syncTransactions('mock-access');
    expect(page.added).toEqual([]);
    expect(page.modified).toEqual([]);
    expect(page.removed).toEqual([]);
    expect(page.hasMore).toBe(false);
  });
});

describe('PlaidAdapter (mocked client)', () => {
  // Monkey patch PlaidAdapter internal client after construction
  function makeAdapter() {
    const a = new PlaidAdapter({ clientId: 'id', secret: 'sec', env: 'sandbox' });
    // Local inline shape types not exported (removed explicit declarations to satisfy lint rules)
    // @ts-expect-error accessing private for test mock injection
    a.client = {
      linkTokenCreate: async () => ({
        data: { link_token: 'ltok', expiration: new Date().toISOString() },
      }),
      itemPublicTokenExchange: async () => ({
        data: { access_token: 'acc_tok', item_id: 'item123' },
      }),
      accountsGet: async () => ({
        data: {
          accounts: [
            {
              account_id: 'acc1',
              name: 'Checking',
              official_name: 'Primary Checking',
              balances: { current: 123.45, iso_currency_code: 'USD' },
              type: 'depository',
              subtype: 'checking',
              mask: '1111',
            },
          ],
        },
      }),
      transactionsSync: async () => ({
        data: {
          added: [
            {
              transaction_id: 't1',
              account_id: 'acc1',
              date: '2025-01-01',
              name: 'Coffee',
              amount: 4.5,
              iso_currency_code: 'USD',
              pending: false,
              category: ['Food', 'Coffee'],
            },
          ],
          modified: [],
          removed: [],
          next_cursor: 'cursor2',
          has_more: false,
        },
      }),
    } as unknown as PlaidAdapter['client'];
    return a;
  }
  it('creates link token (plaid adapter)', async () => {
    const a = makeAdapter();
    const lt = await a.createLinkToken({ userId: 'u1', groupId: 'g1' });
    expect(lt.linkToken).toBe('ltok');
  });
  it('exchanges public token (plaid adapter)', async () => {
    const a = makeAdapter();
    const res = await a.exchangePublicToken('pub');
    expect(res.accessToken).toBe('acc_tok');
  });
  it('maps accounts', async () => {
    const a = makeAdapter();
    const accounts = await a.getAccounts('acc_tok');
    expect(accounts.length).toBeGreaterThan(0);
    const first = accounts[0];
    expect(first?.name).toBe('Checking');
    expect(first?.currentBalance).toBe(123.45);
  });
  it('syncs transactions', async () => {
    const a = makeAdapter();
    const page = await a.syncTransactions('acc_tok');
    expect(page.added.length).toBe(1);
    expect(page.nextCursor).toBe('cursor2');
  });
});
