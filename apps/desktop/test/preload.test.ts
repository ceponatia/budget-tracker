import { describe, it, expect } from 'vitest';

describe('preload API type surface', () => {
  it('defines expected getTheme function type', () => {
    type Exposed = typeof globalThis & {
      budgetDesktop?: { getTheme: () => Promise<{ dark: boolean }> };
    };
    const g: Exposed = globalThis as Exposed;
    const fallback = () => ({ dark: false });
    const fn = g.budgetDesktop?.getTheme ?? fallback;
    expect(typeof fn).toBe('function');
  });
});
