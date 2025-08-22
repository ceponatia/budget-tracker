/** App composition root: builds Express app with all routes & middleware (no listen) */
import * as express from 'express';
import { loadConfig } from '@budget/config';
import { AuthService, InMemoryUserRepository } from '@budget/auth';
import { TokenService, InMemoryRefreshTokenRepository } from '@budget/tokens';
import { GroupService } from '@budget/groups';
import { AccountsIngestionService, InMemoryAccountRepository } from '@budget/accounts';
import { createMockAdapter, type TransactionRecord } from '@budget/provider';
import {
  TransactionsSyncService,
  InMemoryTransactionRepository,
  TransactionsQueryService,
  TransactionsMutationService,
} from '@budget/transactions';
import {
  InMemoryBudgetsRepository,
  BudgetsService,
  BudgetComputationService,
} from '@budget/budgets';
import { openApiSpec } from './openapi.js';
import { logger } from '@budget/logging';
import { registerBudgetRoutes } from './routes/budgets-routes.js';
import { registerAuthRoutes } from './routes/auth-routes.js';
import { registerGroupRoutes } from './routes/groups-routes.js';
import { registerAccountRoutes } from './routes/accounts-routes.js';
import { registerTransactionRoutes } from './routes/transactions-routes.js';
import {
  AppError,
  buildAuthMiddleware,
  traceMiddleware,
  wrap,
  type TraceRequest,
} from './routes/shared.js';

export function createApp(): express.Express {
  const app = express.default();
  app.use(express.json());
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  });
  app.use(traceMiddleware);

  // Services & singletons
  const cfg = loadConfig();
  const userRepo = new InMemoryUserRepository();
  const refreshRepo = new InMemoryRefreshTokenRepository();
  const tokenService = new TokenService(cfg.secrets.jwtSecret, refreshRepo, {
    accessTtlSec: cfg.numeric.accessTtlSec,
    refreshTtlSec: cfg.numeric.refreshTtlSec,
  });
  const authService = new AuthService(userRepo);
  const groupService = new GroupService();
  const accountRepo = new InMemoryAccountRepository();
  const accountService = new AccountsIngestionService({
    provider: createMockAdapter(),
    repo: accountRepo,
    now: () => new Date(),
  });
  const transactionRepo = new InMemoryTransactionRepository();
  const transactionService = new TransactionsSyncService({
    provider: createMockAdapter(),
    repo: transactionRepo,
    now: () => new Date(),
    categorize: (r: TransactionRecord) => r.category ?? ['Uncategorized'],
  });
  const transactionQuery = new TransactionsQueryService(transactionRepo);
  const transactionMutations = new TransactionsMutationService(transactionRepo);
  const budgetsRepo = new InMemoryBudgetsRepository();
  const budgetsService = new BudgetsService({ repo: budgetsRepo });
  const budgetCompute = new BudgetComputationService({
    budgets: budgetsService,
    listGroupTransactions: async () => {
      const list = await transactionRepo.listByAccount('acc_mock_1');
      return list.map((t) => ({ amount: t.amount, category: t.category, postedAt: t.postedAt }));
    },
  });
  const authMiddleware = buildAuthMiddleware(new TextDecoder().decode(cfg.secrets.jwtSecret));

  // OpenAPI
  app.get('/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });

  // Route registration
  registerAuthRoutes({ app, authService, tokenService });
  registerGroupRoutes({ app, groupService, authMiddleware });
  registerAccountRoutes({ app, accountService, authMiddleware });
  registerTransactionRoutes({
    app,
    transactionService,
    transactionQuery,
    transactionMutations,
    authMiddleware,
  });
  registerBudgetRoutes({ app, budgetsService, budgetCompute, authMiddleware, AppError, wrap });

  // Error handler (after routes)
  app.use((err: unknown, req: TraceRequest, res: express.Response, _next: express.NextFunction) => {
    const traceId = req.traceId;
    const log = req.log ?? logger.child({ traceId });
    const appErr = err instanceof AppError ? err : new AppError('INTERNAL_ERROR', 500);
    if (appErr.httpStatus >= 500 && err instanceof Error) {
      log.error('request.error', err, { code: appErr.code });
    } else {
      log.warn('request.error', { code: appErr.code });
    }
    res.status(appErr.httpStatus).json({ error: { code: appErr.code }, traceId });
  });

  return app;
}
