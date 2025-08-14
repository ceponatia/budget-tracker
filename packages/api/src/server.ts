// API server entry (T-009)
// Purpose: Express app exposing auth & group endpoints.
import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '@budget/auth';
import { InMemoryUserRepository } from '@budget/auth';
import { TokenService, InMemoryRefreshTokenRepository, verifyAccessToken } from '@budget/tokens';
import { GroupService } from '@budget/groups';

const app = express();
app.use(express.json());

// In-memory singletons (replace with real persistence later)
const userRepo = new InMemoryUserRepository();
const refreshRepo = new InMemoryRefreshTokenRepository();
const tokenSecret = new TextEncoder().encode('dev-secret-change');
const tokenService = new TokenService(tokenSecret, refreshRepo, { accessTtlSec: 900, refreshTtlSec: 60 * 60 * 24 });
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
  if (!hdr?.startsWith('Bearer ')) return res.status(401).json({ error: 'UNAUTHORIZED' });
  const token = hdr.slice(7);
  verifyAccessToken(tokenSecret, token)
    .then(({ userId }) => { req.userId = userId; next(); })
    .catch(() => res.status(401).json({ error: 'UNAUTHORIZED' }));
}

// Routes
app.post('/auth/register', async (req: Request, res: Response) => {
  const parsed = registrationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT', issues: parsed.error.issues });
  try {
    const { user } = await authService.register(parsed.data);
    const tokens = await tokenService.issueSession(user);
    res.status(201).json({ user, ...tokens });
  } catch (e) {
    res.status(400).json({ error: (e as any).code ?? 'REGISTRATION_FAILED' });
  }
});

app.post('/auth/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' });
  try {
    const { user } = await authService.login(parsed.data);
    const tokens = await tokenService.issueSession(user);
    res.json({ user, ...tokens });
  } catch (e) {
    res.status(401).json({ error: (e as any).code ?? 'INVALID_CREDENTIALS' });
  }
});

app.post('/auth/refresh', async (req: Request, res: Response) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' });
  try {
    const tokens = await tokenService.refresh(parsed.data.refreshToken);
    res.json(tokens);
  } catch (e) {
    res.status(401).json({ error: 'INVALID_REFRESH' });
  }
});

app.post('/groups', authMiddleware, async (req: Request & { userId: string }, res: Response) => {
  const parsed = createGroupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' });
  const { group } = await groupService.createGroup({ name: parsed.data.name, ownerUserId: req.userId });
  res.status(201).json({ group });
});

app.post('/groups/:id/invite', authMiddleware, async (req: Request & { userId: string }, res: Response) => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' });
  try {
    const invite = await groupService.issueInvite({ groupId: req.params.id, invitedEmail: parsed.data.invitedEmail });
    res.status(201).json({ invite });
  } catch (e) {
    res.status(400).json({ error: 'INVITE_FAILED' });
  }
});

export function createServer() { return app; }

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`API listening on :${port}`));
}
