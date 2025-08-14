import { UserId } from '@budget/domain';

export interface RefreshTokenRecord {
  id: string;
  userId: UserId;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string;
  replacedByTokenId?: string;
}

export interface IRefreshTokenRepository {
  create(rec: Omit<RefreshTokenRecord, 'id'>): Promise<RefreshTokenRecord>;
  findByTokenHash(hash: string): Promise<RefreshTokenRecord | null>;
  revoke(id: string, replacedByTokenId?: string): Promise<void>;
}

export class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private store = new Map<string, RefreshTokenRecord>();
  private byHash = new Map<string, string>();

  async create(rec: Omit<RefreshTokenRecord, 'id'>): Promise<RefreshTokenRecord> {
    const id = crypto.randomUUID();
    const full: RefreshTokenRecord = { id, ...rec };
    this.store.set(id, full);
    this.byHash.set(full.tokenHash, id);
    return full;
  }
  async findByTokenHash(hash: string): Promise<RefreshTokenRecord | null> {
    const id = this.byHash.get(hash);
  return id ? this.store.get(id) ?? null : null;
  }
  async revoke(id: string, replacedByTokenId?: string): Promise<void> {
    const rec = this.store.get(id);
    if (rec) {
      rec.revokedAt = new Date().toISOString();
      rec.replacedByTokenId = replacedByTokenId;
    }
  }
}
