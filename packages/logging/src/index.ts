/**
 * Logging utilities (T-014)
 * Structured JSON logging with optional in-memory sink for tests.
 */
import { randomUUID } from 'crypto';

export interface LogRecord {
  level: 'debug' | 'info' | 'warn' | 'error';
  msg: string;
  ts: string; // ISO timestamp
  traceId?: string;
  fields?: Record<string, unknown>;
  err?: { code?: string; message: string; stack?: string };
}

const testBuffer: LogRecord[] = [];

function emit(rec: LogRecord): void {
  if (process.env.NODE_ENV === 'test') {
    testBuffer.push(rec);
  }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(rec));
}

export const logger = {
  child(extra: { traceId?: string } = {}): ReturnType<typeof createLogger> {
    return createLogger(extra.traceId);
  },
  get testBuffer(): LogRecord[] {
    return testBuffer;
  },
};

function createLogger(traceId?: string): {
  traceId?: string;
  debug: (msg: string, fields?: Record<string, unknown>) => void;
  info: (msg: string, fields?: Record<string, unknown>) => void;
  warn: (msg: string, fields?: Record<string, unknown>) => void;
  error: (msg: string, err?: unknown, fields?: Record<string, unknown>) => void;
} {
  return {
    traceId,
    debug(msg: string, fields?: Record<string, unknown>) {
      emit(record('debug', msg, traceId, fields));
    },
    info(msg: string, fields?: Record<string, unknown>) {
      emit(record('info', msg, traceId, fields));
    },
    warn(msg: string, fields?: Record<string, unknown>) {
      emit(record('warn', msg, traceId, fields));
    },
    error(msg: string, err?: unknown, fields?: Record<string, unknown>) {
      const base = record('error', msg, traceId, fields);
      base.err = serializeErr(err);
      emit(base);
    },
  };
}

function record(
  level: LogRecord['level'],
  msg: string,
  traceId?: string,
  fields?: Record<string, unknown>,
): LogRecord {
  return { level, msg, ts: new Date().toISOString(), traceId, fields };
}

function hasMessage(x: unknown): x is { message: unknown } {
  return typeof x === 'object' && x !== null && 'message' in (x as Record<string, unknown>);
}
function serializeErr(err: unknown): LogRecord['err'] | undefined {
  if (err == null) return undefined; // null or undefined
  if (err instanceof Error) return { message: err.message, stack: err.stack };
  if (hasMessage(err)) return { message: String(err.message) };
  return { message: String(err) };
}

export function newTraceId(): string {
  return randomUUID();
}

export type { LogRecord as BudgetLogRecord };
