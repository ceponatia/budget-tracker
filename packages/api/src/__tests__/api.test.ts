import { describe, it, expect } from 'vitest';
import request, { type Response as SupertestResponse } from 'supertest';
import { createServer } from '../server.js';
import { logger, type LogRecord } from '@budget/logging';
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

describe('API (T-009, T-014, T-015)', () => {
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

  it('login invalid credentials returns standardized error shape', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'missing@example.com', password: 'WrongPassword123!' });
    interface ErrShape {
      error: { code: string };
      traceId: string;
    }
    const body = res.body as unknown as ErrShape;
    expect(res.status).toBe(401);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
    expect(typeof body.traceId).toBe('string');
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

  it('serves openapi spec', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    const spec = parseJson<{ openapi: string; paths: Record<string, unknown> }>(res);
    expect(spec.openapi).toMatch(/^3\.1/);
    expect(spec.paths['/auth/register']).toBeTruthy();
  });

  it('emits structured log entries with traceId', async () => {
    const before = logger.testBuffer.length;
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    const after = logger.testBuffer.length;
    expect(after).toBeGreaterThan(before);
    const recent: LogRecord[] = logger.testBuffer.slice(-3); // last few entries
    expect(recent.some((r) => r.msg === 'request.start')).toBe(true);
    expect(recent.some((r) => r.msg === 'request.end')).toBe(true);
    expect(recent.every((r) => typeof r.traceId === 'string')).toBe(true);
  });
});
