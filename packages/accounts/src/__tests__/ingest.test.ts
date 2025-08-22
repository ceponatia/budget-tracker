import { describe, it, expect } from 'vitest';
import { AccountsIngestionService, InMemoryAccountRepository } from '../index.js';
import { createMockAdapter, type ProviderAdapter, type ProviderAccount } from '@budget/provider';

// Extend mock adapter to return sample accounts
function makeAdapter(): ProviderAdapter {
  const base = createMockAdapter();
  const override: ProviderAdapter = {
    ...base,
    async getAccounts(): Promise<ProviderAccount[]> {
      const acc: ProviderAccount = {
        id: 'acc_ext_1' as unknown as ProviderAccount['id'],
        externalAccountId: 'acc_ext_1',
        groupId: 'grp_1' as unknown as ProviderAccount['groupId'],
        providerType: 'PLAID',
        name: 'Checking',
        institutionName: 'Test Bank',
        type: 'depository',
        subtype: 'checking',
        currentBalance: 12300,
        currency: 'USD',
      };
      return [acc];
    },
  };
  return override;
}

describe('AccountsIngestionService', () => {
  it('maps and persists accounts', async () => {
    const repo = new InMemoryAccountRepository();
    const svc = new AccountsIngestionService({
      provider: makeAdapter(),
      repo,
      now: () => new Date('2025-01-01T00:00:00Z'),
    });
    const { accounts } = await svc.syncGroupAccounts({
      groupId: 'grp_1',
      accessToken: 'mock-access',
    });
    expect(accounts.length).toBe(1);
    expect(accounts[0]?.name).toBe('Checking');
    const list = await svc.list('grp_1');
    expect(list.length).toBe(1);
    expect(list[0]?.lastSyncedAt).toBe('2025-01-01T00:00:00.000Z');
  });
});
