// In-memory user repository (T-006)
// Purpose: Simple placeholder persistence for auth unit tests; replace with real datastore later.
import { User, asUserId } from '@budget/domain';

export interface UserRecord extends User {
  passwordHash: string;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  create(email: string, passwordHash: string): Promise<UserRecord>;
}

export class InMemoryUserRepository implements IUserRepository {
  private users = new Map<string, UserRecord>();

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.users.get(email.toLowerCase()) ?? null;
  }

  async create(email: string, passwordHash: string): Promise<UserRecord> {
    const now = new Date().toISOString();
    const record: UserRecord = Object.freeze({
      id: asUserId(`usr_${crypto.randomUUID()}`),
      email: email.toLowerCase(),
      mfaEnabled: false,
      createdAt: now,
      passwordHash,
    });
    this.users.set(record.email, record);
    return record;
  }
}
