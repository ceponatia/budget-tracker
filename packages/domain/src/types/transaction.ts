/**
 * Transaction domain type (Phase 2 T-027)
 */
import { AccountId } from './ids.js';

export interface Transaction {
  id: string; // provider external id for now (will swap to internal UUID once persistence added)
  accountId: AccountId;
  postedAt: string; // ISO date
  description: string;
  amount: number; // minor units (cents)
  currency: string;
  pending: boolean;
  category?: string[];
  modifiedAt?: string; // for updated transactions
  removed?: boolean; // tombstone marker
}
