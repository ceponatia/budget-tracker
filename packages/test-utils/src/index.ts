/**
 * Test utilities (T-016)
 * Purpose: Provide strongly-typed helpers for integration tests to reduce duplication.
 */
import request, { type Response as SupertestResponse, type Test } from 'supertest';
import type { Express } from 'express';

// Minimal DTOs (subset of OpenAPI schemas)
export interface UserDto { id: string; email: string; mfaEnabled: boolean; createdAt: string }
export interface TokenPair { accessToken: string; refreshToken: string }
export interface RegisterResponse extends TokenPair { user: UserDto }
export type RefreshResponse = TokenPair;
export interface GroupDto { id: string; name: string; ownerUserId: string; createdAt: string }
export interface CreateGroupResponse { group: GroupDto }
export interface Invite { token: string; groupId: string; invitedEmail: string; createdAt: string; expiresAt: string; acceptedAt?: string | null }
export interface InviteResponse { invite: Invite }
export interface ErrorResponse { error: { code: string }; traceId: string }

export function registerUser(app: Express, email: string, password = 'StrongPassw0rd!') {
  return request(app).post('/auth/register').send({ email, password });
}
export function refreshSession(app: Express, refreshToken: string) {
  return request(app).post('/auth/refresh').send({ refreshToken });
}
export function authHeaders(accessToken: string) { return { Authorization: `Bearer ${accessToken}` }; }

export function parseJson<T>(res: SupertestResponse): T {
  return res.body as T; // trusted inside tests (server already validated)
}

export async function createGroup(app: Express, accessToken: string, name: string): Promise<CreateGroupResponse> {
  const res = await request(app)
    .post('/groups')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name });
  return parseJson<CreateGroupResponse>(res);
}

export async function issueInvite(app: Express, accessToken: string, groupId: string, invitedEmail: string): Promise<InviteResponse> {
  const res = await request(app)
    .post(`/groups/${groupId}/invite`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ invitedEmail });
  return parseJson<InviteResponse>(res);
}
