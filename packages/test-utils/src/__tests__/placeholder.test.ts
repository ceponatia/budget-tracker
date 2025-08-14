import { describe, it, expect } from 'vitest';
import { authHeaders } from '../index.js';

describe('test-utils (T-016)', () => {
  it('authHeaders builds bearer header', () => {
    expect(authHeaders('abc').Authorization).toBe('Bearer abc');
  });
});
