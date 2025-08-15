import {
  Group,
  GroupInvite,
  GroupMembership,
  GroupRole,
  asGroupId,
  asUserId,
} from '@budget/domain';
import { IGroupRepository, InMemoryGroupRepository } from './repository.js';

export interface CreateGroupInput {
  name: string;
  ownerUserId: string;
}
export interface InviteInput {
  groupId: string;
  invitedEmail: string;
  ttlHours?: number;
}

export class GroupService {
  constructor(private repo: IGroupRepository = new InMemoryGroupRepository()) {}
  async createGroup(
    input: CreateGroupInput,
  ): Promise<{ group: Group; ownerMembership: GroupMembership }> {
    const group = await this.repo.create(input.name, input.ownerUserId);
    const membership: GroupMembership = {
      groupId: group.id,
      userId: asUserId(input.ownerUserId),
      role: 'OWNER',
      joinedAt: new Date().toISOString(),
    };
    await this.repo.addMembership(membership);
    return { group, ownerMembership: membership };
  }
  async addMember(
    groupId: string,
    userId: string,
    role: GroupRole = 'MEMBER',
  ): Promise<GroupMembership> {
    const m: GroupMembership = {
      groupId: asGroupId(groupId),
      userId: asUserId(userId),
      role,
      joinedAt: new Date().toISOString(),
    };
    await this.repo.addMembership(m);
    return m;
  }
  async issueInvite(input: InviteInput): Promise<GroupInvite> {
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().slice(0, 8);
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + (input.ttlHours ?? 24) * 3600 * 1000);
    const invite: GroupInvite = {
      token,
      groupId: asGroupId(input.groupId),
      invitedEmail: input.invitedEmail.toLowerCase(),
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    await this.repo.createInvite(invite);
    return invite;
  }
  async acceptInvite(token: string, userId: string): Promise<GroupMembership> {
    const invite = await this.repo.getInvite(token);
    if (!invite) throw new Error('INVITE_NOT_FOUND');
    if (invite.acceptedAt) throw new Error('INVITE_ALREADY_ACCEPTED');
    if (new Date(invite.expiresAt).getTime() < Date.now()) throw new Error('INVITE_EXPIRED');
    const membership = await this.addMember(invite.groupId, userId);
    await this.repo.updateInvite(token, { acceptedAt: new Date().toISOString() });
    return membership;
  }
  async listMembers(groupId: string): Promise<GroupMembership[]> {
    return this.repo.listMemberships(asGroupId(groupId));
  }
  async listInvites(groupId: string): Promise<GroupInvite[]> {
    return this.repo.listInvites(asGroupId(groupId));
  }
}
