/**
 * Provider abstraction (T-021 groundwork) and Plaid adapter placeholder.
 * Defines the interface the rest of the system relies upon so we can
 * implement Plaid now and add additional providers later (T-150).
 */
import { Account } from '@budget/domain';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

export interface LinkTokenRequest { userId: string; groupId: string; }
export interface LinkTokenResponse { linkToken: string; expiration: string; }
export interface PublicTokenExchangeResult { accessToken: string; itemId: string; }
export interface ProviderAccount extends Account { externalAccountId: string; mask?: string; officialName?: string; };

export interface TransactionRecord {
  id: string; // external transaction id
  accountId: string; // external account id
  postedAt: string; // ISO date
  description: string;
  amount: number; // minor units (cents)
  currency: string;
  pending: boolean;
  category?: string[];
}

export interface TransactionsSyncPage {
  added: TransactionRecord[];
  modified: TransactionRecord[];
  removed: { id: string }[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface ProviderAdapter {
  createLinkToken(req: LinkTokenRequest): Promise<LinkTokenResponse>;
  exchangePublicToken(publicToken: string): Promise<PublicTokenExchangeResult>;
  getAccounts(accessToken: string): Promise<ProviderAccount[]>;
  syncTransactions(accessToken: string, cursor?: string): Promise<TransactionsSyncPage>;
}

/**
 * Plaid adapter placeholder – actual implementation (T-022) will wrap plaid client.
 */
export class PlaidAdapter implements ProviderAdapter {
  private client: PlaidApi;
  constructor(private opts: { clientId: string; secret: string; env: 'sandbox' | 'development' | 'production' }) {
    const configuration = new Configuration({
      basePath: PlaidEnvironments[opts.env],
      baseOptions: { headers: { 'PLAID-CLIENT-ID': opts.clientId, 'PLAID-SECRET': opts.secret } },
    });
    this.client = new PlaidApi(configuration);
  }
  async createLinkToken(req: LinkTokenRequest): Promise<LinkTokenResponse> {
    const res = await this.client.linkTokenCreate({
      user: { client_user_id: req.userId },
      client_name: 'BudgetPro',
      products: [Products.Transactions],
      language: 'en',
      country_codes: [CountryCode.Us],
    });
    return { linkToken: res.data.link_token, expiration: res.data.expiration };
  }
  async exchangePublicToken(publicToken: string): Promise<PublicTokenExchangeResult> {
    const { data } = await this.client.itemPublicTokenExchange({ public_token: publicToken });
    return { accessToken: data.access_token, itemId: data.item_id };
  }
  async getAccounts(accessToken: string): Promise<ProviderAccount[]> {
    const { data } = await this.client.accountsGet({ access_token: accessToken });
    return data.accounts.map(acc => ({
      id: acc.account_id as any,
      externalAccountId: acc.account_id,
      groupId: 'UNASSIGNED' as any, // will be set by calling layer
      providerType: 'PLAID',
      name: acc.name || acc.official_name || 'Account',
      officialName: acc.official_name || undefined,
      mask: acc.mask || undefined,
      institutionName: undefined,
      type: acc.type || undefined,
      subtype: acc.subtype || undefined,
      currency: acc.balances.iso_currency_code || undefined,
      currentBalance: acc.balances.current ?? undefined,
    }));
  }
  async syncTransactions(accessToken: string, cursor?: string): Promise<TransactionsSyncPage> {
    const { data } = await this.client.transactionsSync({ access_token: accessToken, cursor, count: 100 });
    return {
      added: data.added.map(t => ({
        id: t.transaction_id,
        accountId: t.account_id,
        postedAt: t.date,
        description: t.name,
        amount: Math.round(t.amount * 100),
        currency: t.iso_currency_code || 'USD',
        pending: t.pending ?? false,
        category: t.category || undefined,
      })),
      modified: data.modified.map(t => ({
        id: t.transaction_id,
        accountId: t.account_id,
        postedAt: t.date,
        description: t.name,
        amount: Math.round(t.amount * 100),
        currency: t.iso_currency_code || 'USD',
        pending: t.pending ?? false,
        category: t.category || undefined,
      })),
      removed: data.removed.map(r => ({ id: r.transaction_id })),
      nextCursor: data.next_cursor || undefined,
      hasMore: data.has_more,
    };
  }
}

export interface PlaidAdapterEnv {
  PLAID_CLIENT_ID?: string; PLAID_SECRET?: string; PLAID_ENV?: 'sandbox' | 'development' | 'production';
}
export function plaidAdapterFromEnv(env: PlaidAdapterEnv): PlaidAdapter {
  if (!env.PLAID_CLIENT_ID || !env.PLAID_SECRET) throw new Error('PLAID_CONFIG_MISSING');
  return new PlaidAdapter({ clientId: env.PLAID_CLIENT_ID, secret: env.PLAID_SECRET, env: env.PLAID_ENV || 'sandbox' });
}

export function createMockAdapter(): ProviderAdapter {
  return {
    async createLinkToken(): Promise<LinkTokenResponse> { return { linkToken: 'mock-link', expiration: new Date(Date.now()+3600*1000).toISOString() }; },
    async exchangePublicToken(): Promise<PublicTokenExchangeResult> { return { accessToken: 'mock-access', itemId: 'item-1' }; },
    async getAccounts(): Promise<ProviderAccount[]> { return []; },
    async syncTransactions(): Promise<TransactionsSyncPage> { return { added: [], modified: [], removed: [], hasMore: false }; },
  };
}
