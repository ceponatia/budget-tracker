/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../server.js';

// Integration tests for T-009 endpoints

describe('API (T-009)', () => {
  const app = createServer();
  let refreshToken = '';
  let accessToken = '';
  let groupId = '';

  it('registers user and returns tokens', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'user1@example.com', password: 'StrongPassw0rd!' });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    refreshToken = res.body.refreshToken;
    accessToken = res.body.accessToken;
  });

  it('refresh rotates refresh token', async () => {
    const res = await request(app).post('/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.refreshToken).not.toBe(refreshToken);
    refreshToken = res.body.refreshToken;
  });

  it('creates group with auth', async () => {
    const res = await request(app)
      .post('/groups')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'MyGroup' });
    expect(res.status).toBe(201);
    groupId = res.body.group.id;
  });

  it('issues invite', async () => {
    const res = await request(app)
      .post(`/groups/${groupId}/invite`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ invitedEmail: 'invitee@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.invite.token).toBeTruthy();
  });
});
