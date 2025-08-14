import { AccountId, GroupId } from './ids.js';

export type ProviderType = 'PLAID' | 'STRIPE_FC' | 'MANUAL';

export interface Account {
  id: AccountId;
  groupId: GroupId;
  providerType: ProviderType;
  name: string;
  institutionName?: string;
  type?: string; // e.g., depository, credit, loan
  subtype?: string; // e.g., checking, savings
  currentBalance?: number; // Minor units consideration future (#1)
  currency?: string; // ISO 4217
  lastSyncedAt?: string; // ISO timestamp
}
