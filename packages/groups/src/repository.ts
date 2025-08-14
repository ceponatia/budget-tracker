import { Group, GroupId, GroupInvite, GroupMembership, asGroupId, asUserId } from '@budget/domain';

export interface IGroupRepository {
  create(name: string, ownerUserId: string): Promise<Group>;
  get(id: GroupId): Promise<Group | null>;
  addMembership(m: GroupMembership): Promise<void>;
  listMemberships(groupId: GroupId): Promise<GroupMembership[]>;
  createInvite(invite: GroupInvite): Promise<GroupInvite>;
  getInvite(token: string): Promise<GroupInvite | null>;
  updateInvite(token: string, patch: Partial<GroupInvite>): Promise<void>;
  listInvites(groupId: GroupId): Promise<GroupInvite[]>;
}

export class InMemoryGroupRepository implements IGroupRepository {
  private groups = new Map<string, Group>();
  private memberships: GroupMembership[] = [];
  private invites = new Map<string, GroupInvite>();

  async create(name: string, ownerUserId: string): Promise<Group> {
    const g: Group = { id: asGroupId(`grp_${crypto.randomUUID()}`), ownerUserId: asUserId(ownerUserId), name, createdAt: new Date().toISOString() } as Group;
    this.groups.set(g.id, g);
    return g;
  }
  async get(id: GroupId): Promise<Group | null> { return this.groups.get(id) ?? null; }
  async addMembership(m: GroupMembership): Promise<void> { this.memberships.push(m); }
  async listMemberships(groupId: GroupId): Promise<GroupMembership[]> { return this.memberships.filter(m => m.groupId === groupId); }
  async createInvite(invite: GroupInvite): Promise<GroupInvite> { this.invites.set(invite.token, invite); return invite; }
  async getInvite(token: string): Promise<GroupInvite | null> { return this.invites.get(token) ?? null; }
  async updateInvite(token: string, patch: Partial<GroupInvite>): Promise<void> { const ex = this.invites.get(token); if (ex) Object.assign(ex, patch); }
  async listInvites(groupId: GroupId): Promise<GroupInvite[]> { return Array.from(this.invites.values()).filter(i => i.groupId === groupId); }
}
