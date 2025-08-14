// API server entry (T-009)
// Purpose: Express app exposing auth & group endpoints.
// eslint-disable-next-line import/no-named-as-default-member -- express default import is intentional
import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService, InMemoryUserRepository } from '@budget/auth';
import { TokenService, InMemoryRefreshTokenRepository, verifyAccessToken } from '@budget/tokens';
import { GroupService } from '@budget/groups';
import { openApiSpec } from './openapi.js';

const app = express();
app.use(express.json());

// In-memory singletons (replace with real persistence later)
const userRepo = new InMemoryUserRepository();
const refreshRepo = new InMemoryRefreshTokenRepository();
const tokenSecret = new TextEncoder().encode('dev-secret-change');
const tokenService = new TokenService(tokenSecret, refreshRepo, {
  accessTtlSec: 900,
  refreshTtlSec: 60 * 60 * 24,
});
const authService = new AuthService(userRepo);
const groupService = new GroupService();

// Helpers
const registrationSchema = z.object({ email: z.string().email(), password: z.string().min(12) });
const loginSchema = registrationSchema; // same shape
const refreshSchema = z.object({ refreshToken: z.string().min(10) });
const createGroupSchema = z.object({ name: z.string().min(1) });
const inviteSchema = z.object({ invitedEmail: z.string().email() });

function authMiddleware(req: Request & { userId?: string }, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization;
  if (!hdr?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  const token = hdr.slice(7);
  void (async () => {
    try {
      const { userId } = await verifyAccessToken(tokenSecret, token);
      req.userId = userId;
      next();
    } catch (_err: unknown) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
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
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_INPUT', issues: parsed.error.issues });
      return;
    }
    try {
      const { user } = await authService.register(parsed.data);
      const tokens = await tokenService.issueSession(user);
      res.status(201).json({ user, ...tokens });
    } catch (e: unknown) {
      const code =
        typeof e === 'object' && e && 'code' in e ? (e as { code?: string }).code : undefined;
      res.status(400).json({ error: code ?? 'REGISTRATION_FAILED' });
    }
  }),
);

app.post(
  '/auth/login',
  wrap(async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_INPUT' });
      return;
    }
    try {
      const { user } = await authService.login(parsed.data);
      const tokens = await tokenService.issueSession(user);
      res.json({ user, ...tokens });
    } catch (e: unknown) {
      const code =
        typeof e === 'object' && e && 'code' in e ? (e as { code?: string }).code : undefined;
      res.status(401).json({ error: code ?? 'INVALID_CREDENTIALS' });
    }
  }),
);

app.post(
  '/auth/refresh',
  wrap(async (req: Request, res: Response) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_INPUT' });
      return;
    }
    try {
      const tokens = await tokenService.refresh(parsed.data.refreshToken);
      res.json(tokens);
    } catch (_e: unknown) {
      res.status(401).json({ error: 'INVALID_REFRESH' });
    }
  }),
);

app.post(
  '/groups',
  authMiddleware,
  wrap<Request & { userId: string }>(async (req, res) => {
    const parsed = createGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_INPUT' });
      return;
    }
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
  wrap<Request & { userId: string }>(async (req, res) => {
    const parsed = inviteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_INPUT' });
      return;
    }
    try {
      const groupId = req.params.id ?? '';
      const invite = await groupService.issueInvite({
        groupId,
        invitedEmail: parsed.data.invitedEmail,
      });
      res.status(201).json({ invite });
    } catch (_e: unknown) {
      res.status(400).json({ error: 'INVITE_FAILED' });
    }
  }),
);

export function createServer(): express.Express {
  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const raw = process.env.PORT;
  const port: number = raw ? Number(raw) : 3000;
  app.listen(port, () => {
    console.log(`API listening on :${String(port)}`);
  });
}
