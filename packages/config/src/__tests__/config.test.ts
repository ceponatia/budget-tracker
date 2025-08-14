import { describe, it, expect } from 'vitest';
import { loadConfig, resetConfigForTests } from '../index.js';

describe('config schema (T-018)', () => {
  it('loads defaults', () => {
    resetConfigForTests();
    const cfg = loadConfig({});
    expect(cfg.numeric.accessTtlSec).toBeGreaterThan(100);
  });
  it('throws on invalid JWT_SECRET length', () => {
    resetConfigForTests();
    expect(() =>
      loadConfig({
        JWT_SECRET: 'short',
        PORT: '3001',
        ACCESS_TTL_SEC: '900',
        REFRESH_TTL_SEC: String(60 * 60 * 24),
        NODE_ENV: 'test',
      }),
    ).toThrow(/CONFIG_INVALID/);
  });
});
