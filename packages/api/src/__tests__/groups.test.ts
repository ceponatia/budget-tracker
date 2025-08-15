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
});

export {};
