import { describe, it, expect } from 'vitest';
import { createServer } from '../server.js';
import {
  registerUser,
  createGroup,
  issueInvite,
  expectStatus,
  validate,
  RegisterResponseSchema,
} from '@budget/test-utils';
import request from 'supertest';
import { z } from 'zod';

describe('Group + invite flows', () => {
  const app = createServer();
  let accessToken = '';
  let groupId = '';

  it('registers baseline user', async () => {
    const res = await registerUser(app, 'groupsplit1@example.com');
    expectStatus(res, 201);
    const parsed = validate(RegisterResponseSchema, res.body);
    accessToken = parsed.accessToken;
  });

  it('creates group', async () => {
    const { group } = await createGroup(app, accessToken, 'MyGroup');
    groupId = group.id;
    expect(groupId).toBeTruthy();
  });

  it('issues invite', async () => {
    const { invite } = await issueInvite(app, accessToken, groupId, 'invitee@example.com');
    expect(invite.token.length).toBeGreaterThan(5);
  });

  it('syncs accounts (T-025)', async () => {
    const res = await request(app)
      .post('/accounts/sync')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ accessToken: 'mock-access' });
    expect(res.status).toBe(200);
    const Schema = z.object({ accounts: z.array(z.object({ id: z.string().optional() })) });
    const parsed = Schema.safeParse(res.body);
    expect(parsed.success).toBe(true);
  });

  it('syncs transactions (T-027)', async () => {
    const res = await request(app)
      .post('/transactions/sync')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
    expect(res.status).toBe(200);
    const SyncSchema = z.object({ added: z.number(), modified: z.number(), removed: z.number() });
    const parsed = SyncSchema.safeParse(res.body);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.added).toBeGreaterThanOrEqual(0);
  });

  it('lists transactions (T-028)', async () => {
    // ensure at least one sync done already above
    const res = await request(app)
      .get('/transactions')
      .query({ accountId: 'acc_mock_1', limit: 10 })
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    const ListSchema = z.object({
      items: z.array(z.object({ id: z.string() })),
      nextCursor: z.string().optional(),
    });
    const parsed = ListSchema.safeParse(res.body);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.items.length).toBeGreaterThanOrEqual(0);
  });

  it('edits transaction category (T-031)', async () => {
    // pick first transaction id via list
    const listRes = await request(app)
      .get('/transactions')
      .query({ accountId: 'acc_mock_1', limit: 1 })
      .set('Authorization', `Bearer ${accessToken}`);
    const ListOneSchema = z.object({ items: z.array(z.object({ id: z.string() })) });
    const parsedList = ListOneSchema.safeParse(listRes.body);
    expect(parsedList.success).toBe(true);
    if (!parsedList.success) return;
    const txId = parsedList.data.items[0]?.id;
    expect(txId).toBeDefined();
    if (!txId) return; // if no transaction present (edge case)
    const patchRes = await request(app)
      .patch(`/transactions/${txId}/category`)
      .query({ accountId: 'acc_mock_1' })
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ category: 'EditedCat' });
    expect(patchRes.status).toBe(200);
    const PatchSchema = z.object({
      transaction: z.object({ id: z.string(), category: z.array(z.string()) }),
    });
    const parsedPatch = PatchSchema.safeParse(patchRes.body);
    expect(parsedPatch.success).toBe(true);
    if (parsedPatch.success) expect(parsedPatch.data.transaction.category).toEqual(['EditedCat']);
  });
});

export {};
