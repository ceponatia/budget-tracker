import { GroupId, UserId } from './ids.js';

export interface Group {
  id: GroupId;
  ownerUserId: UserId;
  name: string;
  createdAt: string;
}
