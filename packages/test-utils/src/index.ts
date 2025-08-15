/**
 * Test utilities (T-016)
 * Purpose: Provide strongly-typed helpers for integration tests to reduce duplication.
 */
import request, { type Test as SupertestTest } from 'supertest';
import type { Express } from 'express';
import { z } from 'zod';

// Minimal DTOs (subset of OpenAPI schemas)
export interface UserDto {
  id: string;
  email: string;
  mfaEnabled: boolean;
  createdAt: string;
}
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
export interface RegisterResponse extends TokenPair {
  user: UserDto;
}
export type RefreshResponse = TokenPair;
export interface GroupDto {
  id: string;
  name: string;
  ownerUserId: string;
  createdAt: string;
}
export interface CreateGroupResponse {
  group: GroupDto;
}
export interface Invite {
  token: string;
  groupId: string;
  invitedEmail: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string | null;
}
export interface InviteResponse {
  invite: Invite;
}
export interface ErrorResponse {
  error: { code: string };
  traceId: string;
}

// Zod schemas for runtime validation in integration tests
export const UserDtoSchema = z.object({
  id: z.string(),
  email: z.string(),
  mfaEnabled: z.boolean(),
  createdAt: z.string(),
});
export const RegisterResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: UserDtoSchema,
});
export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export const ErrorResponseSchema = z.object({
  error: z.object({ code: z.string() }),
  traceId: z.string(),
});

// Provide a typed JSON response removing the `any` on SupertestResponse.body
export interface TestResponse<T> {
  status: number;
  body: T;
}

async function doJson<T>(req: SupertestTest): Promise<TestResponse<T>> {
  const res = await req;
  // Supertest Response#body is any; force unknown first then cast to generic to avoid unsafe-member-access in callers once validated.
  const body: unknown = res.body as unknown;
  return { status: Number(res.status), body: body as T };
}
export function registerUser(
  app: Express,
  email: string,
  password = 'StrongPassw0rd!',
): Promise<TestResponse<RegisterResponse>> {
  return doJson<RegisterResponse>(request(app).post('/auth/register').send({ email, password }));
}
export function refreshSession(
  app: Express,
  refreshToken: string,
): Promise<TestResponse<RefreshResponse>> {
  return doJson<RefreshResponse>(request(app).post('/auth/refresh').send({ refreshToken }));
}
export function authHeaders(accessToken: string): { Authorization: string } {
  return { Authorization: `Bearer ${accessToken}` };
}

export function parseJson<T>(res: { body: unknown }): T {
  return res.body as T; // test-only unchecked cast
}

export async function createGroup(
  app: Express,
  accessToken: string,
  name: string,
): Promise<CreateGroupResponse> {
  const res = await request(app)
    .post('/groups')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name });
  return parseJson<CreateGroupResponse>(res);
}

export async function issueInvite(
  app: Express,
  accessToken: string,
  groupId: string,
  invitedEmail: string,
): Promise<InviteResponse> {
  const res = await request(app)
    .post(`/groups/${groupId}/invite`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ invitedEmail });
  return parseJson<InviteResponse>(res);
}

export function expectStatus<T extends { status: number }>(res: T, expected: number): void {
  if (res.status !== expected)
    throw new Error('Expected status ' + String(expected) + ' got ' + String(res.status));
}

export function validate<T>(schema: z.ZodSchema<T>, body: unknown): T {
  return schema.parse(body);
}
