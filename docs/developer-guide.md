# Developer Guide (T-019)

Covers local setup, scripts, troubleshooting.

## 1. Prerequisites

- Node.js 20+ (matrix tests 20 & 22).
- pnpm >= 8.

## 2. Install

```bash
pnpm install
```

## 3. Key Scripts

| Command                    | Purpose                                                 |
| -------------------------- | ------------------------------------------------------- |
| `pnpm lint`                | ESLint on source (no warnings allowed)                  |
| `pnpm typecheck`           | Builds all TS project references (no emit)              |
| `pnpm test`                | Runs all unit tests (current unified suite)             |
| (planned) `pnpm test:unit` | Alias for fast unit scope once integration split exists |
| `pnpm spec:lint`           | Lints OpenAPI spec (generates `openapi.generated.json`) |
| `pnpm config:check`        | Validates environment variables via schema              |

## 4. OpenAPI (T-017)

Spec lives in `packages/api/src/openapi.ts`. CI runs a lint to guard for drift and missing operationIds. Dumped JSON written to `openapi.generated.json`.

## 5. Config Schema (T-018)

Central config: `@budget/config` validates required environment. Extend schema before introducing new env vars. In production a default `JWT_SECRET` is rejected.

### 5.1 Environment Variables Workflow

1. Copy `.env.example` to `.env` for local development.
2. Adjust secrets (e.g., generate a strong `JWT_SECRET`).
3. (Optional) Add Plaid sandbox credentials (`PLAID_CLIENT_ID`, `PLAID_SECRET`) to exercise real aggregator flows.
4. Run `pnpm config:check` to validate.
5. Never commit `.env` (gitignored); update `.env.example` when adding new keys.

## 6. Testing Utilities (T-016)

`@budget/test-utils` exports helpers for API integration tests (register, createGroup, issueInvite) to reduce duplication and enforce runtime validation.

Notes:

- The legacy monolithic `api.test.ts` has been removed; tests are now domain-scoped (e.g., `auth.test.ts`, `groups.test.ts`).
- Helpers return typed results and apply zod validation where appropriate so we avoid unsafe `any` patterns.
- When adding new integration tests prefer composing existing helpers; if a new helper is needed add accompanying unit tests in `@budget/test-utils`.

## 7. Troubleshooting

| Symptom                                | Fix                                               |
| -------------------------------------- | ------------------------------------------------- |
| CONFIG_INVALID error                   | Provide required env vars or correct value types  |
| Spectral failing operation-operationId | Add unique `operationId` to offending path method |
| Electron smoke failing                 | Inspect `electron-smoke.log` artifact from CI     |

## 8. Adding New Packages

1. Create directory under `packages/` with `package.json` + `tsconfig.json`.
2. Add reference in root `tsconfig.json`.
3. Import using `@budget/<name>`.

## 9. Logging & Errors

See `docs/security-baseline.md` (T-013) and implementation in `@budget/logging` and API error middleware.

## 10. API Architecture Update (Aug 2025)

- `app.ts` (in `packages/api/src/`) is the composition root creating services + registering modular route groups (auth, groups, accounts, transactions, budgets).
- `server.ts` is a thin bootstrap (listen only) exporting `createServer()` for tests.
- Shared middleware/utilities (trace, auth, error wrapper) live under `packages/api/src/routes/`.
- This separation enables future dependency injection (swap in test doubles without editing bootstrap).

### Planned Test Script Segmentation

Add root scripts:

`"test:unit": "pnpm -r --workspace-concurrency=1 --filter ./packages/* --filter ./apps/* test"`

Later introduce `test:integration` (API HTTP + e2e) and have root `test` run both.

-- End of Developer Guide v0.2
