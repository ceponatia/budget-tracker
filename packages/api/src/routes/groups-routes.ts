/** Group + invite routes */
import type { Express, Response } from 'express';
import { z } from 'zod';
import type { GroupService } from '@budget/groups';
import { AppError, wrap, type TraceRequest } from './shared.js';

export interface GroupRouteDeps {
  app: Express;
  groupService: GroupService;
  authMiddleware: (req: TraceRequest, res: Response, next: (err?: unknown) => void) => void;
}

export function registerGroupRoutes({ app, groupService, authMiddleware }: GroupRouteDeps): void {
  const createGroupSchema = z.object({ name: z.string().min(1) });
  const inviteSchema = z.object({ invitedEmail: z.string().email() });

  app.post(
    '/groups',
    authMiddleware,
    wrap<TraceRequest & { userId: string }>(async (req, res) => {
      const parsed = createGroupSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('INVALID_INPUT', 400, 'Invalid group input');
      const { group } = await groupService.createGroup({
        name: parsed.data.name,
        ownerUserId: req.userId,
      });
      res.status(201).json({ group });
    }),
  );

  app.post(
    '/groups/:id/invite',
    authMiddleware,
    wrap<TraceRequest & { userId: string }>(async (req, res) => {
      const parsed = inviteSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('INVALID_INPUT', 400, 'Invalid invite input');
      const groupId = req.params.id ?? '';
      const invite = await groupService.issueInvite({
        groupId,
        invitedEmail: parsed.data.invitedEmail,
      });
      res.status(201).json({ invite });
    }),
  );
}
