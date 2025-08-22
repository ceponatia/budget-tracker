// Deprecated legacy integration test replaced by domain-split tests.
// Retained with a no-op test so Vitest treats suite as passing rather than failing for zero tests.
import { describe, it } from 'vitest';
describe('legacy placeholder', () => {
  it('noop', () => {
    /* no-op */
  });
});
