import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../server.js';

describe('OpenAPI spec endpoint', () => {
  const app = createServer();
  it('serves openapi spec', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    const spec: unknown = res.body;
    if (!spec || typeof spec !== 'object') throw new Error('SPEC_NOT_OBJECT');
    const openapi = (spec as { openapi?: unknown }).openapi;
    expect(typeof openapi).toBe('string');
    if (typeof openapi === 'string') expect(openapi.startsWith('3.')).toBe(true);
    const paths = (spec as { paths?: unknown }).paths;
    if (paths && typeof paths === 'object') {
      expect((paths as Record<string, unknown>)['/auth/register']).toBeTruthy();
    }
  });
});

export {};
