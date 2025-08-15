import { describe, it, expect } from 'vitest';
import { createServer } from '../server.js';
import {
  registerUser,
  refreshSession,
  expectStatus,
  validate,
  RegisterResponseSchema,
  RefreshResponseSchema,
} from '@budget/test-utils';

describe('Auth flows (register + refresh)', () => {
  const app = createServer();
  let refreshToken = '';
  let _accessToken = '';

  it('registers user', async () => {
    const res = await registerUser(app, 'authsplit1@example.com');
    expectStatus(res, 201);
    const parsed = validate(RegisterResponseSchema, res.body);
    expect(parsed.accessToken.length).toBeGreaterThan(10);
    refreshToken = parsed.refreshToken;
    _accessToken = parsed.accessToken;
  });

  it('refresh rotates token', async () => {
    const res = await refreshSession(app, refreshToken);
    expectStatus(res, 200);
    const refreshed = validate(RefreshResponseSchema, res.body);
    expect(refreshed.refreshToken).not.toBe(refreshToken);
    refreshToken = refreshed.refreshToken;
    _accessToken = refreshed.accessToken;
  });
});

export {}; // module marker
