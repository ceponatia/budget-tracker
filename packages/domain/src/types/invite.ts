import { GroupId } from './ids.js';

export interface GroupInvite {
  token: string; // opaque invite token
  groupId: GroupId;
  invitedEmail: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
}
