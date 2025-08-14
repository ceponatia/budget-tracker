import { describe, it, expect } from 'vitest';
import { InMemoryUserRepository, AuthService } from '@budget/auth';
import { InMemoryRefreshTokenRepository } from '../refresh-repository.js';
import { TokenService, verifyAccessToken } from '../token-service.js';
import { SessionAuthService } from '../session-auth-service.js';

function makeSecret() { return new TextEncoder().encode('test-secret-key-please-change'); }

describe('SessionAuthService / TokenService (T-007)', () => {
  it('login returns access + refresh tokens', async () => {
    const userRepo = new InMemoryUserRepository();
    const auth = new AuthService(userRepo);
    await auth.register({ email: 'a@example.com', password: 'StrongPassw0rd!' });
    const tokenRepo = new InMemoryRefreshTokenRepository();
    const tokens = new TokenService(makeSecret(), tokenRepo, { accessTtlSec: 60 });
    const sessionAuth = new SessionAuthService(auth, tokens);
    const { accessToken, refreshToken, user } = await sessionAuth.loginWithTokens({ email: 'a@example.com', password: 'StrongPassw0rd!' });
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    const decoded = await verifyAccessToken(makeSecret(), accessToken);
    expect(decoded.userId).toBe(user.id);
  });
  it('refresh rotates refresh token (old invalid)', async () => {
    const userRepo = new InMemoryUserRepository();
    const auth = new AuthService(userRepo);
    await auth.register({ email: 'b@example.com', password: 'StrongPassw0rd!' });
    const tokenRepo = new InMemoryRefreshTokenRepository();
    const secret = makeSecret();
    const tokens = new TokenService(secret, tokenRepo, { accessTtlSec: 60 });
    const sessionAuth = new SessionAuthService(auth, tokens);
    const first = await sessionAuth.loginWithTokens({ email: 'b@example.com', password: 'StrongPassw0rd!' });
    const second = await tokens.refresh(first.refreshToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);
    await expect(tokens.refresh(first.refreshToken)).rejects.toThrow();
  });
});
