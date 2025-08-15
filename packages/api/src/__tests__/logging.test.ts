import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { logger, type LogRecord } from '@budget/logging';
import { createServer } from '../server.js';

describe('Structured logging with traceId', () => {
  const app = createServer();
  it('emits traceId entries', async () => {
    const before = logger.testBuffer.length;
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    const after = logger.testBuffer.length;
    expect(after).toBeGreaterThan(before);
    const recent: LogRecord[] = logger.testBuffer.slice(-4);
    expect(recent.some((r) => r.msg === 'request.start')).toBe(true);
    expect(recent.some((r) => r.msg === 'request.end')).toBe(true);
    expect(recent.every((r) => typeof r.traceId === 'string')).toBe(true);
  });
});

export {};
