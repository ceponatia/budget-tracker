/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { SignJWT, jwtVerify } from 'jose';
const toHex = (bytes: ArrayBuffer): string => {
  const arr = new Uint8Array(bytes);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
};
import { User, UserId, asUserId } from '@budget/domain';
import { IRefreshTokenRepository } from './refresh-repository.js';

export interface IssuedTokens { accessToken: string; refreshToken: string; }
export interface ITokenService { issueSession(user: User): Promise<IssuedTokens>; refresh(refreshToken: string): Promise<IssuedTokens>; }
interface TokenServiceOpts { accessTtlSec?: number; refreshTtlSec?: number; }

export class TokenService implements ITokenService {
  private accessTtl: number; private refreshTtl: number;
  constructor(private secret: Uint8Array, private repo: IRefreshTokenRepository, opts: TokenServiceOpts = {}) {
    this.accessTtl = opts.accessTtlSec ?? 900;
    this.refreshTtl = opts.refreshTtlSec ?? 60 * 60 * 24 * 30;
  }
  private async hashRefresh(raw: string): Promise<string> {
    const data = new TextEncoder().encode(raw);
    const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
  }
  async issueSession(user: User): Promise<IssuedTokens> {
    const now = Math.floor(Date.now() / 1000);
    // Build JWT (builder chain kept separate for clarity)
    const builder = new SignJWT({ sub: user.id, typ: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + this.accessTtl);
  /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
    const accessToken = await builder.sign(this.secret);
  /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
    const rawRefresh = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const refreshHash = await this.hashRefresh(rawRefresh);
    const expiresAt = new Date(Date.now() + this.refreshTtl * 1000).toISOString();
  await this.repo.create({ userId: user.id, tokenHash: refreshHash, createdAt: new Date().toISOString(), expiresAt });
    return { accessToken, refreshToken: rawRefresh };
  }
  async refresh(refreshToken: string): Promise<IssuedTokens> {
    const hash = await this.hashRefresh(refreshToken);
    const rec = await this.repo.findByTokenHash(hash);
    if (!rec || rec.revokedAt) throw new Error('INVALID_REFRESH');
    if (new Date(rec.expiresAt).getTime() < Date.now()) throw new Error('EXPIRED_REFRESH');
  await this.repo.revoke(rec.id);
  const user: User = { id: asUserId(rec.userId), email: 'placeholder@example.com', mfaEnabled: false, createdAt: rec.createdAt };
  return this.issueSession(user);
  }
}
export async function verifyAccessToken(secret: Uint8Array, token: string): Promise<{ userId: UserId }> {
  const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
  return { userId: asUserId(String(payload.sub)) };
}
/* eslint-enable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
