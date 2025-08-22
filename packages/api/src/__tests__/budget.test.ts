import { describe, it, expect } from 'vitest';
import request from 'supertest';

interface RegisterResponse {
  accessToken: string;
  user: { id: string; email: string };
}
interface CategoryResponse {
  category: { id: string; name: string };
}
interface PeriodResponse {
  period: { id: string; startDate: string };
}
import { createServer } from '../server.js';

// Integration tests for budget creation endpoints (T-033)

describe('Budget endpoints (T-033)', () => {
  const app = createServer();
  let accessToken: string;

  it('registers user to obtain auth token', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'b1@example.com', password: 'averysecurepassword' });
    expect(res.status).toBe(201);
    const regUnknown: unknown = res.body;
    const body = regUnknown as RegisterResponse;
    accessToken = body.accessToken;
    expect(typeof accessToken).toBe('string');
  });

  it('creates category', async () => {
    const res = await request(app)
      .post('/budget/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ groupId: 'grp_demo', name: 'Food' });
    expect(res.status).toBe(201);
    const catUnknown: unknown = res.body;
    const body = catUnknown as CategoryResponse;
    expect(body.category.name).toBe('Food');
  });

  it('creates period', async () => {
    const res = await request(app)
      .post('/budget/periods')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ groupId: 'grp_demo', startDate: '2025-01-01' });
    expect(res.status).toBe(201);
    const perUnknown: unknown = res.body;
    const body = perUnknown as PeriodResponse;
    expect(body.period.startDate).toBe('2025-01-01');
  });

  it('rejects invalid allocation input', async () => {
    const res = await request(app)
      .post('/budget/allocations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ periodId: '', categoryId: '', amount: -1, currency: 'US' });
    expect(res.status).toBe(400);
  });
});
