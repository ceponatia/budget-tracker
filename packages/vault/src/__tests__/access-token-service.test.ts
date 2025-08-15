import { describe, it, expect } from 'vitest';
import { AccessTokenVault, InMemoryAccessTokenRepository, AccessTokenService } from '../index.js';

function uuid() {
  return '00000000-0000-4000-8000-000000000000';
}
function now() {
  return new Date('2025-08-15T00:00:00.000Z');
}

describe('AccessTokenService', () => {
  it('stores and reveals encrypted access token', async () => {
    const service = new AccessTokenService({
      vault: new AccessTokenVault(),
      repo: new InMemoryAccessTokenRepository(),
      uuid,
      now,
    });
    const rec = await service.store('item-1', 'PLAID', 'secret-access-token');
    expect(rec.blob.ciphertext).not.toContain('secret-access-token');
    const revealed = await service.reveal('item-1');
    expect(revealed).toBe('secret-access-token');
  });
  it('rotates access token', async () => {
    const service = new AccessTokenService({
      vault: new AccessTokenVault(),
      repo: new InMemoryAccessTokenRepository(),
      uuid,
      now,
    });
    await service.store('item-1', 'PLAID', 'tok1');
    const rotated = await service.rotate('item-1', 'PLAID', 'tok2');
    expect(rotated.rotatedAt).toBeDefined();
    const revealed = await service.reveal('item-1');
    expect(revealed).toBe('tok2');
  });
});
