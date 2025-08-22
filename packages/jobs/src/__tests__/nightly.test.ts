import { describe, it, expect, vi } from 'vitest';
import { NightlySyncJob, type NightlySyncDeps } from '../index.js';
import type { ProviderAdapter } from '@budget/provider';
import type { AccountsIngestionService } from '@budget/accounts';
import type { TransactionsSyncService } from '@budget/transactions';

interface TestDeps {
  provider: ProviderAdapter;
  accounts: { syncGroupAccounts: ReturnType<typeof vi.fn> };
  transactions: { fullSync: ReturnType<typeof vi.fn> };
  log: NightlySyncDeps['log'];
  logCalls: { msg: string; fields?: Record<string, unknown> }[];
}
function makeDeps(): TestDeps {
  const provider: ProviderAdapter = {
    createLinkToken: vi.fn(),
    exchangePublicToken: vi.fn(),
    getAccounts: vi.fn(),
    syncTransactions: vi.fn(),
  };
  // Use loosely typed async mocks to avoid signature drift when service return types evolve.
  const accounts = {
    syncGroupAccounts: vi.fn(async () => ({ accounts: [] })) as unknown as ReturnType<typeof vi.fn>,
  };
  const transactions = {
    fullSync: vi.fn(async () => ({ added: 1, modified: 0, removed: 0 })) as unknown as ReturnType<
      typeof vi.fn
    >,
  };
  const logCalls: TestDeps['logCalls'] = [];
  const log: NightlySyncDeps['log'] = (msg, fields) => {
    logCalls.push({ msg, fields });
  };
  return { provider, accounts, transactions, log, logCalls };
}

describe('NightlySyncJob', () => {
  it('iterates tokens and logs', async () => {
    const d = makeDeps();
    const job = new NightlySyncJob({
      provider: d.provider,
      accounts: {
        syncGroupAccounts: d.accounts.syncGroupAccounts,
      } as unknown as AccountsIngestionService,
      transactions: { fullSync: d.transactions.fullSync } as unknown as TransactionsSyncService,
      log: d.log,
      listAccessTokens: async () => [
        { groupId: 'grp1', accessToken: 'tok1' },
        { groupId: 'grp2', accessToken: 'tok2' },
      ],
    });
    await job.run();
    expect(d.accounts.syncGroupAccounts.mock.calls.length).toBe(2);
    expect(d.transactions.fullSync.mock.calls.length).toBe(2);
    expect(d.logCalls.filter((c) => c.msg === 'nightly.sync.start').length).toBe(2);
  });
});
