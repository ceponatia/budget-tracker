import { describe, it, expect } from 'vitest';
import { logger, newTraceId } from '../index.js';

describe('logger (T-014)', () => {
  it('emits log with traceId', () => {
    const id = newTraceId();
    const child = logger.child({ traceId: id });
    child.info('test.msg');
    const found = logger.testBuffer.find(r => r.traceId === id && r.msg === 'test.msg');
    expect(found).toBeTruthy();
  });
});
