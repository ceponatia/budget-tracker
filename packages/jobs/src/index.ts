/**
 * Nightly sync job skeleton (T-026)
 * Purpose: coordinates account + transaction sync for all known access tokens (placeholder in-memory list)
 */
import type { ProviderAdapter } from '@budget/provider';
import { AccountsIngestionService } from '@budget/accounts';
import { TransactionsSyncService } from '@budget/transactions';

export interface NightlySyncDeps {
  provider: ProviderAdapter;
  accounts: AccountsIngestionService;
  transactions: TransactionsSyncService;
  log: (msg: string, fields?: Record<string, unknown>) => void;
  listAccessTokens(): Promise<{ groupId: string; accessToken: string }[]>; // placeholder
}

export class NightlySyncJob {
  constructor(private deps: NightlySyncDeps) {}
  async run(): Promise<void> {
    const tokens = await this.deps.listAccessTokens();
    for (const t of tokens) {
      this.deps.log('nightly.sync.start', { groupId: t.groupId });
      await this.deps.accounts.syncGroupAccounts({
        groupId: t.groupId,
        accessToken: t.accessToken,
      });
      await this.deps.transactions.fullSync(t.accessToken);
      this.deps.log('nightly.sync.end', { groupId: t.groupId });
    }
  }
}
