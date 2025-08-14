import { describe, it, expect } from 'vitest';
import { GroupService } from '../service.js';

describe('GroupService (T-008)', () => {
  it('creates group with owner membership', async () => {
    const svc = new GroupService();
    const { group, ownerMembership } = await svc.createGroup({ name: 'Family', ownerUserId: 'usr_owner' });
    expect(group.name).toBe('Family');
    expect(ownerMembership.role).toBe('OWNER');
    const members = await svc.listMembers(group.id);
    expect(members.length).toBe(1);
  });
  it('adds member and lists memberships', async () => {
    const svc = new GroupService();
    const { group } = await svc.createGroup({ name: 'Team', ownerUserId: 'usr_owner2' });
    await svc.addMember(group.id, 'usr_member1');
    const members = await svc.listMembers(group.id);
  expect(members.length).toBe(2);
  });
  it('issues unique invites and accepts one', async () => {
    const svc = new GroupService();
    const { group } = await svc.createGroup({ name: 'Club', ownerUserId: 'usr_owner3' });
    const invites = await Promise.all(
      Array.from({ length: 5 }).map((_, idx) =>
        svc.issueInvite({ groupId: group.id, invitedEmail: `user${String(idx)}@ex.com` })
      )
    );
    const tokens = new Set(invites.map(i => i.token));
    expect(tokens.size).toBe(invites.length);
  if (!invites[0]) throw new Error('invite missing');
  const membership = await svc.acceptInvite(invites[0].token, 'usr_new');
    expect(membership.groupId).toBe(group.id);
  });
});
