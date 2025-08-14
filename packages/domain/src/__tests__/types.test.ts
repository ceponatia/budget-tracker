import { describe, it, expect } from 'vitest';
import { asUserId, asGroupId, asAccountId, User, Group, Account } from '../index.js';

describe('domain types', () => {
  it('constructs sample entities with branded IDs', () => {
    const user: User = {
      id: asUserId('u_123'),
      email: 'test@example.com',
      mfaEnabled: false,
      createdAt: new Date().toISOString(),
    };
    const group: Group = {
      id: asGroupId('g_123'),
      ownerUserId: user.id,
      name: 'Family',
      createdAt: new Date().toISOString(),
    };
    const account: Account = {
      id: asAccountId('a_123'),
      groupId: group.id,
      providerType: 'MANUAL',
      name: 'Cash',
    };

    expect(account.groupId).toBe(group.id);
    expect(group.ownerUserId).toBe(user.id);
  });
});
