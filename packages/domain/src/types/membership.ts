import { GroupId, UserId } from './ids.js';

export type GroupRole = 'OWNER' | 'MEMBER';

export interface GroupMembership {
  groupId: GroupId;
  userId: UserId;
  role: GroupRole;
  joinedAt: string; // ISO timestamp
}
