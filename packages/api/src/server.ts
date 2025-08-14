// API server entry (T-009)
// Purpose: Express app exposing auth & group endpoints.
// Use namespace import to satisfy import plugin rule & preserve types
// eslint-disable-next-line import/no-named-as-default-member -- false positive in some configs
import * as express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService, InMemoryUserRepository } from '@budget/auth';
import { TokenService, InMemoryRefreshTokenRepository, verifyAccessToken } from '@budget/tokens';
import { loadConfig } from '@budget/config';
import { GroupService } from '@budget/groups';
import { openApiSpec } from './openapi.js';
import { logger, newTraceId } from '@budget/logging';

// AppError & helpers (T-015)
class AppError extends Error {
  constructor(
    public code: string,
    public httpStatus: number,
    message?: string,
  ) {
    super(message ?? code);
  }
}
function hasCode(value: unknown): value is { code: string } {
  if (typeof value !== 'object' || value === null || !('code' in value)) return false;
  return typeof (value as { code: unknown }).code === 'string';
}
function toAppError(e: unknown, fallback: AppError): AppError {
  if (e instanceof AppError) return e;
  if (e instanceof Error && hasCode(e)) {
    return new AppError((e as { code: string }).code, fallback.httpStatus, e.message);
  }
  return fallback;
}

const app = express.default();
app.use(express.json());

// Logging + trace (T-014)
interface TraceRequest extends Request {
  traceId?: string;
  log?: ReturnType<typeof logger.child>;
  userId?: string;
}
app.use((req: TraceRequest, _res, next) => {
  const traceId = newTraceId();
  req.traceId = traceId;
  req.log = logger.child({ traceId });
  const start = Date.now();
  req.log.info('request.start', { method: req.method, url: req.url });
  _res.on('finish', () => {
    const dur = Date.now() - start;
    req.log?.info('request.end', {
      method: req.method,
      url: req.url,
      status: _res.statusCode,
      durMs: dur,
    });
  });
  next();
});

// In-memory singletons (replace with real persistence later)
const userRepo = new InMemoryUserRepository();
const refreshRepo = new InMemoryRefreshTokenRepository();
const cfg = loadConfig();
const tokenSecret = cfg.secrets.jwtSecret;
const tokenService = new TokenService(tokenSecret, refreshRepo, {
  accessTtlSec: cfg.numeric.accessTtlSec,
  refreshTtlSec: cfg.numeric.refreshTtlSec,
});
const authService = new AuthService(userRepo);
const groupService = new GroupService();

// Helpers
const registrationSchema = z.object({ email: z.string().email(), password: z.string().min(12) });
const loginSchema = registrationSchema; // same shape
const refreshSchema = z.object({ refreshToken: z.string().min(10) });
const createGroupSchema = z.object({ name: z.string().min(1) });
const inviteSchema = z.object({ invitedEmail: z.string().email() });

function authMiddleware(req: TraceRequest, _res: Response, next: NextFunction) {
  const hdr = req.headers.authorization;
  if (!hdr?.startsWith('Bearer ')) {
    next(new AppError('UNAUTHORIZED', 401));
    return;
  }
  const token = hdr.slice(7);
  void (async () => {
    try {
      const { userId } = await verifyAccessToken(tokenSecret, token);
      req.userId = userId;
      next();
    } catch (_err: unknown) {
      next(new AppError('UNAUTHORIZED', 401));
    }
  })();
}

// Small helper to wrap async handlers so we do not return a promise directly to Express.
type AsyncHandler<Req extends Request = Request> = (
  req: Req,
  res: Response,
  next: NextFunction,
) => Promise<void>;
function wrap<Req extends Request>(handler: AsyncHandler<Req>) {
  return (req: Request, res: Response, next: NextFunction) => {
    void (handler as AsyncHandler)(req as Req, res, next).catch((err: unknown) => {
      next(err as Error);
    });
  };
}

// Routes
app.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});
app.post(
  '/auth/register',
  wrap(async (req: Request, res: Response) => {
    const parsed = registrationSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('INVALID_INPUT', 400, 'Invalid registration input');
    try {
      const { user } = await authService.register(parsed.data);
      const tokens = await tokenService.issueSession(user);
      res.status(201).json({ user, ...tokens });
    } catch (e: unknown) {
      throw toAppError(e, new AppError('REGISTRATION_FAILED', 400));
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
    } catch (e: unknown) {
      throw toAppError(e, new AppError('INVALID_CREDENTIALS', 401));
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
    } catch (_e: unknown) {
      throw new AppError('INVALID_REFRESH', 401);
    }
  }),
);

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
    try {
      const groupId = req.params.id ?? '';
      const invite = await groupService.issueInvite({
        groupId,
        invitedEmail: parsed.data.invitedEmail,
      });
      res.status(201).json({ invite });
    } catch (_e: unknown) {
      throw new AppError('INVITE_FAILED', 400);
    }
  }),
);

export function createServer(): express.Express {
  return app;
}

// Error handling middleware (after routes)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: TraceRequest, res: Response, _next: NextFunction) => {
  const traceId = req.traceId;
  const log = req.log ?? logger.child({ traceId });
  const appErr = toAppError(err, new AppError('INTERNAL_ERROR', 500));
  if (appErr.httpStatus >= 500) {
    log.error('request.error', err as Error, { code: appErr.code });
  } else {
    log.warn('request.error', { code: appErr.code });
  }
  res.status(appErr.httpStatus).json({ error: { code: appErr.code }, traceId });
});

if (process.env.NODE_ENV !== 'test') {
  const port: number = cfg.PORT;
  app.listen(port, () => {
    logger.child().info('api.start', { port });
  });
}
