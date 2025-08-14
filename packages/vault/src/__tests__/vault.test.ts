import { describe, it, expect } from 'vitest';
import { AccessTokenVault } from '../index.js';

describe('AccessTokenVault', () => {
  it('encrypts and decrypts', async () => {
    const vault = new AccessTokenVault();
    const blob = await vault.store('plain-token-123');
    expect(blob.ciphertext).not.toContain('plain-token-123');
    const recovered = await vault.reveal(blob);
    expect(recovered).toBe('plain-token-123');
  });
});
