import { describe, it, expect } from 'vitest';
import request, { type Response as SupertestResponse } from 'supertest';
import { createServer } from '../server.js';
import type { GroupInvite } from '@budget/domain';

// Typed shapes of API responses (derive minimal needed parts)
interface UserDto {
  id: string;
  email: string;
  mfaEnabled: boolean;
  createdAt: string;
}
interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
interface RegisterResponse extends TokenPair {
  user: UserDto;
}
type RefreshResponse = TokenPair;
interface GroupDto {
  id: string;
  name: string;
  ownerUserId: string;
  createdAt: string;
}
interface CreateGroupResponse {
  group: GroupDto;
}
interface InviteResponse {
  invite: GroupInvite;
}

function parseJson<T>(res: SupertestResponse): T {
  // supertest already parsed JSON into res.body (typed as any); runtime validation could be added.
  return res.body as T; // trusted in test scope; domain runtime validation handled by server.
}

// Integration tests for T-009 endpoints

describe('API (T-009)', () => {
  const app = createServer();
  let refreshToken = '';
  let accessToken = '';
  let groupId = '';

  it('registers user and returns tokens', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'user1@example.com', password: 'StrongPassw0rd!' });
    expect(res.status).toBe(201);
    const body = parseJson<RegisterResponse>(res);
    expect(body.accessToken.length).toBeGreaterThan(10);
    refreshToken = body.refreshToken;
    accessToken = body.accessToken;
  });

  it('refresh rotates refresh token', async () => {
    const res = await request(app).post('/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    const body = parseJson<RefreshResponse>(res);
    expect(body.refreshToken).not.toBe(refreshToken);
    refreshToken = body.refreshToken;
  });

  it('creates group with auth', async () => {
    const res = await request(app)
      .post('/groups')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'MyGroup' });
    expect(res.status).toBe(201);
    const body = parseJson<CreateGroupResponse>(res);
    groupId = body.group.id;
    expect(groupId).toBeTruthy();
  });

  it('issues invite', async () => {
    const res = await request(app)
      .post(`/groups/${groupId}/invite`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ invitedEmail: 'invitee@example.com' });
    expect(res.status).toBe(201);
    const body = parseJson<InviteResponse>(res);
    expect(body.invite.token.length).toBeGreaterThan(5);
  });
});
