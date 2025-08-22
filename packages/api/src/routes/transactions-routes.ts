/** Transactions sync, query, mutation routes */
import type { Express, Response, NextFunction } from 'express';
import { z } from 'zod';
import type {
  TransactionsSyncService,
  TransactionsQueryService,
  TransactionsMutationService,
} from '@budget/transactions';
import { AppError, wrap, type TraceRequest } from './shared.js';

export interface TransactionsRouteDeps {
  app: Express;
  transactionService: TransactionsSyncService;
  transactionQuery: TransactionsQueryService;
  transactionMutations: TransactionsMutationService;
  authMiddleware: (req: TraceRequest, res: Response, next: NextFunction) => void;
}

export function registerTransactionRoutes(deps: TransactionsRouteDeps): void {
  const { app, transactionService, transactionQuery, transactionMutations, authMiddleware } = deps;
  app.post(
    '/transactions/sync',
    authMiddleware,
    wrap<TraceRequest & { userId: string }>(async (_req, res) => {
      const result = await transactionService.fullSync('mock-access');
      res.status(200).json(result);
    }),
  );

  const listTxSchema = z.object({
    accountId: z.string().min(1),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    cursor: z.string().optional(),
    minAmount: z.coerce.number().int().optional(),
    maxAmount: z.coerce.number().int().optional(),
    category: z.string().optional(),
  });
  app.get(
    '/transactions',
    authMiddleware,
    wrap<TraceRequest & { userId: string }>(async (req, res) => {
      const parsed = listTxSchema.safeParse(req.query);
      if (!parsed.success) throw new AppError('INVALID_INPUT', 400, 'Invalid list query');
      const result = await transactionQuery.list(parsed.data);
      res.json(result);
    }),
  );

  const setCategorySchema = z.object({ category: z.string().min(1) });
  app.patch(
    '/transactions/:id/category',
    authMiddleware,
    wrap<TraceRequest & { userId: string }>(async (req, res) => {
      const parsed = setCategorySchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('INVALID_INPUT', 400, 'Invalid category input');
      const accountId = req.query.accountId;
      if (typeof accountId !== 'string' || accountId.length === 0)
        throw new AppError('INVALID_INPUT', 400, 'Missing accountId query param');
      const txId = req.params.id ?? '';
      if (!txId) throw new AppError('INVALID_INPUT', 400, 'Missing transaction id');
      const { updated } = await transactionMutations.setCategory({
        transactionId: txId,
        accountId,
        category: parsed.data.category,
      });
      if (!updated) throw new AppError('NOT_FOUND', 404, 'Transaction not found');
      res.json({ transaction: updated });
    }),
  );
}
