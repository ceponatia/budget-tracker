/**
 * Central environment & configuration schema (T-018)
 * Validates required environment variables at runtime and exports typed config.
 */
import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars').default('dev-secret-change'),
  ACCESS_TTL_SEC: z.string().regex(/^\d+$/).transform(Number).default('900'),
  REFRESH_TTL_SEC: z.string().regex(/^[\d]+$/).transform(Number).default(String(60 * 60 * 24)),
  PLAID_CLIENT_ID: z.string().optional(),
  PLAID_SECRET: z.string().optional(),
  PLAID_ENV: z.enum(['sandbox', 'development', 'production']).optional().default('sandbox'),
  AGGREGATOR_VAULT_KEY: z.string().optional(), // base64 32 bytes preferred
});

export type AppConfig = z.infer<typeof configSchema> & {
  numeric: { accessTtlSec: number; refreshTtlSec: number };
  secrets: { jwtSecret: Uint8Array };
};

let cached: AppConfig | undefined;
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  if (cached) return cached;
  const parsed = configSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i: { path: (string|number)[]; message: string }) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`CONFIG_INVALID: ${issues}`);
  }
  const base = parsed.data;
  cached = {
    ...base,
    numeric: { accessTtlSec: base.ACCESS_TTL_SEC, refreshTtlSec: base.REFRESH_TTL_SEC },
    secrets: { jwtSecret: new TextEncoder().encode(base.JWT_SECRET) },
  };
  return cached;
}

export function resetConfigForTests() { cached = undefined; }
