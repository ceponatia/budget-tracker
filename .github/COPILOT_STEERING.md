# GitHub Copilot Steering Guide

Authoritative guidance for AI pair programming on this repository. Copilot (and similar agents) must align code generation with the architectural, security, compliance, and quality objectives defined in `plan.md`.

## Core Principles
1. Single Codebase, Multi-Target: React + TypeScript front-end reused for Web and Electron desktop shells.
2. Strong Typing Everywhere: `"strict": true` in `tsconfig.json`; no `any` unless justified in code comment with rationale and TODO to refine.
3. Security & Compliance First: Handle financial & PII data with least privilege, encryption, auditing.
4. Offline-First UX: Local cache (SQLite / IndexedDB) with deterministic sync queue & conflict strategy.
5. Clear Separation of Concerns: Domain (entities, value objects), Application (use cases/services), Infrastructure (DB, API clients), Interface (UI / controllers / resolvers).
6. Testable, Observable, Maintainable: Unit + integration tests gate merges; structured logging & metrics from day one.
7. Provider Abstraction: Banking provider (Plaid / Stripe Financial Connections) behind unified interface.

## Layered Architecture (Recommended Directory Skeleton)
```
apps/
  web/                # React SPA
  desktop/            # Electron wrapper (loads web build / dev server)
packages/
  domain/             # Pure TS domain models (User, Account, Transaction, Budget...)
  api/                # Node (NestJS or Express w/ routing-controllers) backend
  shared/             # Cross-cut types, utility libs, validation schemas (zod)
  sync-engine/        # Client-side offline queue & sync logic
  provider/           # Banking provider abstraction + concrete adapters
infra/
  db/migrations/      # Prisma or TypeORM migrations
  scripts/            # Dev/ops scripts
```

## Data Model (High-Level Entities)
- User { id, email, passwordHash?, mfaEnabled, profile, createdAt }
- FamilyGroup { id, name, memberIds[] }
- Account { id, userId|groupId, provider, providerAccountRef, type, name, institution, lastSyncAt, balances }
- Transaction { id, accountId, date, amount, currency, merchant, rawCategory, categoryId, notes, source, hash, updatedAt }
- Category { id, name, parentId?, type }
- Budget { id, userId|groupId, periodStart, periodEnd, name, status }
- BudgetLine { id, budgetId, categoryId, planned, spentComputed, carryOverPolicy }
- SyncChangeLog { id, entityType, entityId, version, op, ts, actor }

All persisted objects MUST include audit fields (`createdAt`, `updatedAt`, `version` or `revision`).

## Strong Typing & Validation
- Use TypeScript with `strict`, `noImplicitAny`, `exactOptionalPropertyTypes`.
- Define domain types in `packages/domain` as immutable value objects where possible.
- Runtime validation at trust boundaries: API input → zod schema → typed domain DTO.
- Never trust provider payloads: validate & map to internal canonical types.

## Coding Standards
- ESLint + Prettier enforced in CI (no warnings on main). Use `@typescript-eslint/recommended`, `security`, `unicorn`, `import` rulesets.
- Naming: `IPlaidClient` for interfaces; `PlaidClientImpl` for concrete; `PascalCase` for types; `camelCase` for functions/vars; `SCREAMING_SNAKE_CASE` for environment var names.
- No side-effectful code in module top-level except DI wiring.
- Pure functions for calculations (budget aggregates, categorization heuristics).
- Explicit return types on exported functions & public class methods.
- Avoid static singletons—prefer dependency injection (NestJS DI container or lightweight custom). 

## Error Handling
- Define discriminated union `AppError` types (e.g., `{ kind: 'AuthError' | 'ValidationError' | 'ProviderError' | 'ConflictError'; message; cause?; meta? }`).
- NEVER throw raw provider errors beyond infrastructure boundary: wrap & sanitize.
- Use HTTP mapping (e.g., ValidationError→422, NotFound→404, Conflict→409).

## Security Requirements (Minimum Baseline)
- Password hashing: argon2id (preferred) or bcrypt cost >= 12.
- JWT access (short lived ~15m) + refresh tokens (rotated). Consider session revocation list in Redis.
- Encrypt provider access tokens using envelope encryption (KMS or libsodium sealed box) before storage.
- Parameterized SQL only (ORM safe) – no string concatenation.
- Secrets via environment variables managed in vault (never commit `.env`). Provide sample `.env.example`.
- Content Security Policy for web build; enable Electron `contextIsolation`, disable `nodeIntegration` in renderer.
- Implement IPC whitelist between Electron main & renderer (no generic `eval`).
- Add audit logging for: login, account link/unlink, data export, deletion, MFA changes.

## Offline & Sync Strategy
- Local store: For web PWA use IndexedDB (Dexie); for Electron use SQLite (better query perf) via WASM or node-native (better to isolate in preload). Provide common repository interface.
- Each mutation creates a SyncOperation object (id, entityType, entityId, op, payload, baseVersion, createdAt).
- Background sync cycle when online: 
  1. Flush outbound queue in order (retry with exponential backoff, idempotent server endpoints using client op idempotency key header `X-Op-Id`).
  2. Pull changed entities since last sync timestamp (incremental, server provides vector clock or per-entity updatedAt & pagination cursor).
  3. Resolve conflicts: if server version > baseVersion and both changed → apply resolution policy (latest write wins) + record conflict entry surfaced in UI.
- Keep sync deterministic & side-effect free except at boundaries (network, storage). Add unit tests using fake clock & mock transport.

## Provider Abstraction
```
interface BankingProvider {
  exchangePublicToken(publicToken: string): Promise<AccessToken>; 
  listAccounts(token: AccessToken): Promise<AccountSummary[]>;
  listTransactions(token: AccessToken, opts: { start: Date; end: Date; cursor?: string }): Promise<{ txns: ProviderTxn[]; nextCursor?: string }>;
}
```
- Concrete adapters: `PlaidProvider`, `StripeFinConnProvider`.
- Wrap rate limiting & retries (exponential backoff, jitter). Include circuit breaker (open after N consecutive provider failures, auto half-open). 

## Testing Strategy
| Level | Scope | Tooling |
|-------|-------|---------|
| Unit | Pure functions, domain rules | Vitest / Jest |
| Integration | API endpoints, DB, provider mocks | Supertest + Docker test db |
| E2E | Critical flows (signup, link account, budget edit, offline->online sync) | Playwright |
| Security | Dependency audit, SAST | `npm audit`, CodeQL, Semgrep |

- Minimum: PR requires all unit + integration tests green and coverage threshold (lines >= 85%, critical domain >= 95%).
- Add isolated test for conflict resolution edge case (simultaneous update) & offline queue persistence after app restart.

## Logging & Observability
- Use structured logger (pino/winston) with bindings: `requestId`, `userId`, `component`, `provider`.
- RED metrics: Rate (requests/sec), Errors (%), Duration (p95) + custom: sync cycle time, queue depth.
- Export OpenTelemetry traces (backend) for critical flows (sync, account link, budget calc).

## Performance Budget
- Initial web bundle < 250KB gzipped (code-split charts & heavy libs).
- Sync round trip < 2s average on broadband. Provide lazy fetch & pagination for transaction list.

## Commit & PR Conventions
- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `perf:`, `build:`.
- Changelog generation automated (Release Please / semantic-release) – future workflow.
- Small, cohesive PRs (< 400 lines diff preferred). Include rationale in description & link to issue.

## Example Terminal Commands
### Initial Setup
```bash
# Clone & bootstrap (after repo has package.json workspaces)
git clone <repo-url> budget
cd budget
corepack enable # ensure pnpm or yarn
pnpm install
```
### Generate Prisma Client & Run Migrations
```bash
pnpm --filter api prisma migrate dev --name init_schema
```
### Start Dev Environment (concurrently)
```bash
pnpm dev  # script should run: backend, web (Vite/Next), electron (optional flag)
```
### Run Tests
```bash
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```
### Lint & Type Check
```bash
pnpm lint
pnpm typecheck
```
### Build Production Artifacts
```bash
pnpm build # builds web, backend, electron dist
```

## Code Generation Guardrails (For Copilot)
When generating code:
1. ALWAYS produce TypeScript with explicit interfaces/types.
2. Provide error handling scaffolding (try/catch wrapping provider calls) + logging statements.
3. Suggest tests alongside new business logic (same PR).
4. Use environment variable placeholders (e.g., `process.env.PLAID_CLIENT_ID`) – NEVER inline secrets.
5. Avoid deprecated Node APIs; prefer native fetch (Node 18+) or `undici`.
6. Mark experimental features with `@alpha` JSDoc tag.
7. Add TODO comments only with linked issue number (e.g., `// TODO(#123): refine categorization model`).

## Electron Specific Hardening
- `BrowserWindow` with: `{ webPreferences: { contextIsolation: true, preload: '.../preload.js', nodeIntegration: false, enableRemoteModule: false, sandbox: true } }`.
- Validate IPC messages schema (zod) in preload → forward to main.
- Use auto-updater with signature validation.

## Accessibility & UX
- WCAG 2.1 AA: label form inputs, `aria-live` for sync status updates.
- Color contrasts: budgeting progress bars meet 4.5:1 ratio.
- Keyboard navigable modals & list views.

## Internationalization (Future Proof)
- Wrap user-facing strings with i18n function `t('key')` now; default locale en-US.

## Deletion & Privacy Requests
- Implement soft-delete (flag) + async erasure job for hard-delete of PII after retention window.
- Provide export endpoint streaming JSONL or ZIP archive of user-owned entities.

## Dependency Policy
- Pin versions (caret allowed for minor unless security sensitive).
- Run `npm audit` / `pnpm audit` on CI; block high severity vulns.
- Add GitHub Dependabot config (future) to limit PR noise (weekly schedule).

## Risk & Edge Cases to Consider
- Large transaction history ( >50k records ) pagination & memory streaming.
- Clock skew between client & server (prefer server authoritative timestamps; client includes monotonic local timestamp for diagnostics).
- Partial sync failures (network drop mid-batch) – ensure idempotency & resume using last acked op.
- Provider webhook out-of-order arrival – process using event sequence or transaction `updated_at`.

## Release Readiness Checklist
- [ ] All migrations applied & reversible.
- [ ] Security headers verified (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
- [ ] Threat model updated (new external APIs?).
- [ ] Load test baseline (p95 latency < 200ms for /api/transactions?page=1).
- [ ] Backup & restore drill passed.

## Non-Goals (Phase 1)
- Native mobile apps.
- Machine learning based categorization (rule-based heuristics only initially).
- Multi-region active-active (DR via backups only at first).

---
Maintain this file as architecture evolves; update sections when key decisions change. Copilot should use this as authoritative context for consistent, secure, and maintainable code generation.
