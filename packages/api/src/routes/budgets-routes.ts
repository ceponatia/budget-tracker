/**
 * Budget routes registration (extracted from server.ts to reduce monolith size)
 * Provides category, period, allocation creation and period summary endpoints.
 */
import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import type { BudgetsService, BudgetComputationService } from '@budget/budgets';
import { asBudgetPeriodId, asCategoryId } from '@budget/budgets';

export interface BudgetRouteDeps {
  app: Express;
  budgetsService: BudgetsService;
  budgetCompute: BudgetComputationService;
  authMiddleware: (req: Request, res: Response, next: (err?: unknown) => void) => void;
  AppError: new (code: string, httpStatus: number, message?: string) => Error;
  wrap: <Req extends Request>(
    handler: (req: Req, res: Response, next: (err?: unknown) => void) => Promise<void>,
  ) => (req: Request, res: Response, next: (err?: unknown) => void) => void;
}

export function registerBudgetRoutes(deps: BudgetRouteDeps): void {
  const { app, budgetsService, budgetCompute, authMiddleware, AppError, wrap } = deps;

  const createCategorySchema = z.object({ groupId: z.string().min(1), name: z.string().min(1) });
  app.post(
    '/budget/categories',
    authMiddleware,
    wrap(async (req: Request, res: Response) => {
      const parsed = createCategorySchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('INVALID_INPUT', 400, 'Invalid category input');
      const category = budgetsService.createCategory(parsed.data);
      res.status(201).json({ category });
    }),
  );

  const createPeriodSchema = z.object({
    groupId: z.string().min(1),
    startDate: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  });
  app.post(
    '/budget/periods',
    authMiddleware,
    wrap(async (req: Request, res: Response) => {
      const parsed = createPeriodSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('INVALID_INPUT', 400, 'Invalid period input');
      const period = budgetsService.createPeriod(parsed.data);
      res.status(201).json({ period });
    }),
  );

  const createAllocationSchema = z.object({
    periodId: z.string().min(1),
    categoryId: z.string().min(1),
    amount: z.number().int().min(0),
    currency: z.string().length(3),
  });
  app.post(
    '/budget/allocations',
    authMiddleware,
    wrap(async (req: Request, res: Response) => {
      const parsed = createAllocationSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('INVALID_INPUT', 400, 'Invalid allocation input');
      const allocation = budgetsService.createAllocation({
        periodId: asBudgetPeriodId(parsed.data.periodId),
        categoryId: asCategoryId(parsed.data.categoryId),
        amount: parsed.data.amount,
        currency: parsed.data.currency,
      });
      res.status(201).json({ allocation });
    }),
  );

  const budgetSummarySchema = z.object({ groupId: z.string().min(1), periodId: z.string().min(1) });
  app.get(
    '/budget/periods/:id/summary',
    authMiddleware,
    wrap(async (req: Request, res: Response) => {
      const parsed = budgetSummarySchema.safeParse({
        groupId: req.query.groupId,
        periodId: req.params.id,
      });
      if (!parsed.success) throw new AppError('INVALID_INPUT', 400, 'Invalid summary input');
      try {
        const summary = await budgetCompute.computePeriodBudget({
          groupId: parsed.data.groupId,
          periodId: asBudgetPeriodId(parsed.data.periodId),
        });
        res.json({ summary });
      } catch (_e) {
        throw new AppError('NOT_FOUND', 404, 'Period not found');
      }
    }),
  );
}
