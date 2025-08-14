// Shared API-local types (request augmentation)
import type { UserId } from '@budget/domain';
import type { Request } from 'express';

export interface AuthedRequest extends Request {
  userId: UserId;
}
