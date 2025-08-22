/**
 * Shared routing utilities: AppError, async wrapper, auth middleware, typed request.
 */
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@budget/tokens';
import { logger, newTraceId } from '@budget/logging';

export class AppError extends Error {
  constructor(
    public code: string,
    public httpStatus: number,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export interface TraceRequest extends Request {
  traceId?: string;
  log?: ReturnType<typeof logger.child>;
  userId?: string; // populated post-auth
}

export type AsyncHandler<Req extends Request = Request> = (
  req: Req,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export function wrap<Req extends Request>(
  handler: AsyncHandler<Req>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    (handler as AsyncHandler)(req as Req, res, next).catch((err: unknown) => {
      const safeErr: Error = err instanceof Error ? err : new Error('UNKNOWN_ERROR');
      next(safeErr);
    });
  };
}

export function buildAuthMiddleware(
  tokenSecret: string,
): (req: TraceRequest, _res: Response, next: NextFunction) => void {
  return function authMiddleware(req: TraceRequest, _res: Response, next: NextFunction): void {
    const hdr = req.headers.authorization;
    if (!hdr?.startsWith('Bearer ')) {
      next(new AppError('UNAUTHORIZED', 401));
      return;
    }
    const token = hdr.slice(7);
    void (async () => {
      try {
        const secretBytes = new TextEncoder().encode(tokenSecret);
        const { userId } = await verifyAccessToken(secretBytes, token);
        req.userId = userId;
        next();
      } catch {
        next(new AppError('UNAUTHORIZED', 401));
      }
    })();
  };
}

// Request logging/trace middleware factory (to be used once in app composition)
export function traceMiddleware(req: TraceRequest, res: Response, next: NextFunction): void {
  const traceId = newTraceId();
  req.traceId = traceId;
  req.log = logger.child({ traceId });
  const start = Date.now();
  req.log.info('request.start', { method: req.method, url: req.url });
  res.on('finish', () => {
    const dur = Date.now() - start;
    req.log?.info('request.end', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      durMs: dur,
    });
  });
  next();
}

export function isErrorWithCode(e: unknown): e is Error & { code: string } {
  return e instanceof Error && typeof (e as { code?: unknown }).code === 'string';
}
