/** Auth & session routes */
import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import type { AuthService } from '@budget/auth';
import type { TokenService } from '@budget/tokens';
import { AppError, wrap, isErrorWithCode } from './shared.js';

export interface AuthRouteDeps {
  app: Express;
  authService: AuthService;
  tokenService: TokenService;
}

export function registerAuthRoutes({ app, authService, tokenService }: AuthRouteDeps): void {
  const registrationSchema = z.object({ email: z.string().email(), password: z.string().min(12) });
  const loginSchema = registrationSchema;
  const refreshSchema = z.object({ refreshToken: z.string().min(10) });

  app.post(
    '/auth/register',
    wrap(async (req: Request, res: Response) => {
      const parsed = registrationSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('INVALID_INPUT', 400, 'Invalid registration input');
      try {
        const { user } = await authService.register(parsed.data);
        const tokens = await tokenService.issueSession(user);
        res.status(201).json({ user, ...tokens });
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        if (isErrorWithCode(err)) throw new AppError(err.code, 400, (err as Error).message);
        throw new AppError('REGISTRATION_FAILED', 400);
      }
    }),
  );

  app.post(
    '/auth/login',
    wrap(async (req: Request, res: Response) => {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('INVALID_INPUT', 400, 'Invalid login input');
      try {
        const { user } = await authService.login(parsed.data);
        const tokens = await tokenService.issueSession(user);
        res.json({ user, ...tokens });
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        throw new AppError('INVALID_CREDENTIALS', 401);
      }
    }),
  );

  app.post(
    '/auth/refresh',
    wrap(async (req: Request, res: Response) => {
      const parsed = refreshSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('INVALID_INPUT', 400, 'Invalid refresh input');
      try {
        const tokens = await tokenService.refresh(parsed.data.refreshToken);
        res.json(tokens);
      } catch {
        throw new AppError('INVALID_REFRESH', 401);
      }
    }),
  );
}
