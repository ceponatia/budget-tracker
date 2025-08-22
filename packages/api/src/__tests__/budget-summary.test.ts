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
interface AllocationResponse {
  allocation: { id: string };
}
interface SummaryResponse {
  summary: { totals: { allocated: number; spent: number } };
}
import { createServer } from '../server.js';

// Tests T-034 budget period summary computation

describe('Budget period summary (T-034)', () => {
  const app = createServer();
  let accessToken: string;
  let periodId: string;
  let categoryId: string;

  it('registers user & creates budget entities', async () => {
    const reg = await request(app)
      .post('/auth/register')
      .send({ email: 'sum@example.com', password: 'averysecurepassword' });
    expect(reg.status).toBe(201);
    const regUnknown: unknown = reg.body;
    const regBody = regUnknown as RegisterResponse;
    accessToken = regBody.accessToken;
    const cat = await request(app)
      .post('/budget/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ groupId: 'grp_demo', name: 'Groceries' });
    expect(cat.status).toBe(201);
    const catUnknown: unknown = cat.body;
    const catBody = catUnknown as CategoryResponse;
    categoryId = catBody.category.id;
    const per = await request(app)
      .post('/budget/periods')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ groupId: 'grp_demo', startDate: '2025-01-01' });
    expect(per.status).toBe(201);
    const perUnknown: unknown = per.body;
    const perBody = perUnknown as PeriodResponse;
    periodId = perBody.period.id;
    const alloc = await request(app)
      .post('/budget/allocations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ periodId, categoryId, amount: 5000, currency: 'USD' });
    expect(alloc.status).toBe(201);
    const _allocUnknown: unknown = alloc.body;
    const _allocBody = _allocUnknown as AllocationResponse; // ensure shape
  });

  it('returns empty spent summary initially', async () => {
    const res = await request(app)
      .get(`/budget/periods/${periodId}/summary?groupId=grp_demo`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    const summaryUnknown: unknown = res.body;
    const body = summaryUnknown as SummaryResponse;
    expect(body.summary.totals.allocated).toBe(5000);
    expect(body.summary.totals.spent).toBe(0);
  });
});
