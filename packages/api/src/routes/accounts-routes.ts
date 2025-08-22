/** Accounts sync routes */
import type { Express, Response, NextFunction } from 'express';
import { z } from 'zod';
import type { AccountsIngestionService } from '@budget/accounts';
import { AppError, wrap, type TraceRequest } from './shared.js';

export interface AccountsRouteDeps {
  app: Express;
  accountService: AccountsIngestionService;
  authMiddleware: (req: TraceRequest, res: Response, next: NextFunction) => void;
}

export function registerAccountRoutes({
  app,
  accountService,
  authMiddleware,
}: AccountsRouteDeps): void {
  const accountsSyncSchema = z.object({ accessToken: z.string().min(1) });
  app.post(
    '/accounts/sync',
    authMiddleware,
    wrap<TraceRequest & { userId: string }>(async (req, res) => {
      const parsed = accountsSyncSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('INVALID_INPUT', 400, 'Invalid sync input');
      const groupId = 'grp_demo';
      const { accounts } = await accountService.syncGroupAccounts({
        groupId,
        accessToken: parsed.data.accessToken,
      });
      res.status(200).json({ accounts });
    }),
  );
}
