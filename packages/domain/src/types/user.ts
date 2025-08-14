import { UserId } from './ids.js';

export interface User {
  id: UserId;
  email: string; // TODO(#2): add runtime email validation schema
  mfaEnabled: boolean;
  createdAt: string; // ISO8601 timestamp
}
