/**
 * Accounts ingestion service (T-025)
 * Purpose: Provide endpoint-facing service to map provider accounts into domain accounts.
 * Persistence: In-memory placeholder until real DB (Phase 2 later tasks) is introduced.
 */
import { Account, asAccountId, asGroupId } from '@budget/domain';
import type { ProviderAdapter, ProviderAccount } from '@budget/provider';

export interface AccountRepository {
  upsertMany(accounts: Account[]): Promise<void>;
  listByGroup(groupId: string): Promise<Account[]>;
}

export class InMemoryAccountRepository implements AccountRepository {
  private byGroup = new Map<string, Account[]>();
  async upsertMany(accounts: Account[]): Promise<void> {
    for (const acc of accounts) {
      const list = this.byGroup.get(acc.groupId) ?? [];
      const idx = list.findIndex((a) => a.id === acc.id);
      if (idx >= 0) list[idx] = acc;
      else list.push(acc);
      this.byGroup.set(acc.groupId, list);
    }
  }
  async listByGroup(groupId: string): Promise<Account[]> {
    return (this.byGroup.get(groupId) ?? []).slice();
  }
}

export interface AccountsIngestionServiceDeps {
  provider: ProviderAdapter;
  repo: AccountRepository;
  now(): Date;
}

export class AccountsIngestionService {
  constructor(private deps: AccountsIngestionServiceDeps) {}
  async syncGroupAccounts(params: {
    groupId: string;
    accessToken: string;
  }): Promise<{ accounts: Account[] }> {
    const providerAccounts: ProviderAccount[] = await this.deps.provider.getAccounts(
      params.accessToken,
    );
    const nowIso = this.deps.now().toISOString();
    const mapped: Account[] = providerAccounts.map(
      (p): Account => ({
        id: asAccountId(p.id),
        groupId: asGroupId(params.groupId),
        providerType: p.providerType,
        name: p.name,
        institutionName: p.institutionName,
        type: p.type,
        subtype: p.subtype,
        currency: p.currency,
        currentBalance: p.currentBalance,
        lastSyncedAt: nowIso,
      }),
    );
    await this.deps.repo.upsertMany(mapped);
    return { accounts: mapped };
  }
  async list(groupId: string): Promise<Account[]> {
    return this.deps.repo.listByGroup(asGroupId(groupId));
  }
}
