# Project Task Breakdown & Execution Plan

Derived from `requirements.md` (v1.0). Each task is intentionally small, ordered, and has clear validation. Complete tasks strictly in sequence unless marked parallelizable. IDs are stable for cross‑referencing in issues/PRs.

Legend:

- Status (initial): PENDING
- Type: FE (frontend), BE (backend), INF (infrastructure/DevOps), SEC (security/compliance), DS (desktop/Electron), OPS (ops/observability), SYNC (sync/offline), QA (quality/testing), DOC (documentation)
- Deliverable: Tangible artifact (code, doc, test coverage)
- Validation: Concrete acceptance / command / test

---

## 0. Project Conventions (Implicit Prereqs)

These conventions apply throughout:

- All code TypeScript strict mode.
- Each domain/service function ships with unit tests.
- Public API changes require updating `requirements.md` / future `CHANGELOG.md`.
- No raw aggregator tokens in logs.

---

## Phase 1: Foundations & Auth (Months 0–1)

### Goal Exit Criteria

Core repo scaffold, CI, basic auth & group model working; Electron shell opens SPA; coding standards + lint/test pipeline enforced.

| ID    | Task                                                                                    | Type | Dependencies | Deliverable                             | Validation                                                      |
| ----- | --------------------------------------------------------------------------------------- | ---- | ------------ | --------------------------------------- | --------------------------------------------------------------- |
| T-001 | Initialize mono-repo structure (apps/, packages/, tooling)                              | INF  | —            | Directory scaffold                      | Tree matches design; README bootstrap section present           |
| T-002 | Add package manager config (pnpm workspaces) & root scripts (build, lint, test)         | INF  | T-001        | `pnpm-workspace.yaml`, scripts          | `pnpm install` succeeds; `pnpm lint` runs                       |
| T-003 | Configure TypeScript strict in all packages (tsconfig base + refs)                      | INF  | T-002        | `tsconfig.base.json`                    | `pnpm typecheck` passes empty stubs                             |
| T-004 | Add ESLint + Prettier + commit hooks (lint-staged + husky)                              | INF  | T-002        | Config files, hooks                     | Commit triggers lint; failing lint blocks                       |
| T-005 | Seed domain package with core types (User, Group, Account skeleton)                     | BE   | T-003        | `packages/domain/src/types/...`         | Type exports build; unit test compiles                          |
| T-006 | Auth service scaffold (register/login, bcrypt/argon2 hashing)                           | BE   | T-005        | `AuthService` + tests                   | Unit tests: register/login OK; password hashed                  |
| T-007 | JWT issuance + refresh token model (DB table)                                           | BE   | T-006        | Token module + migration                | Integration test: login returns access+refresh; refresh rotates |
| T-008 | Group & membership entities + invite token schema                                       | BE   | T-006        | Migrations + repository + tests         | CRUD tests pass; invite token uniqueness                        |
| T-009 | REST endpoints: /auth/register, /auth/login, /auth/refresh, /groups, /groups/:id/invite | BE   | T-007, T-008 | Express/Nest controllers + OpenAPI stub | Supertest integration suite green                               |
| T-010 | Basic React SPA scaffold (routing, auth context, login/register forms)                  | FE   | T-009        | `apps/web` skeleton                     | Manual e2e: can register/login via API                          |
| T-011 | Electron shell loads SPA (dev + prod build)                                             | DS   | T-010        | Electron main + preload                 | Desktop window shows authenticated dashboard                    |
| T-012 | CI pipeline (lint, typecheck, unit, integration)                                        | INF  | T-009, T-010 | CI config (GitHub Actions)              | PR runs all jobs green                                          |
| T-013 | Security baseline doc (password policy, token TTLs, secret handling)                    | SEC  | T-006        | `docs/security-baseline.md`             | Reviewed & linked from README                                   |
| T-014 | Logging middleware (structured JSON w/ trace id)                                        | BE   | T-009        | Logger module + request log tests       | Integration test asserts log fields                             |
| T-015 | Error handling & standardized AppError mapping                                          | BE   | T-009        | Error classes + tests                   | Simulated error returns spec JSON                               |

### Phase 1 Exit Validation

- Register/login works via web & desktop.
- Group creation & invite issuance (token created) validated by test.
- CI enforces style + tests.
- Electron app launches authenticated session.

### Post-Phase 1 Immediate Hardening (Bridge Tasks)

These optional but recommended tasks tighten quality gates before large Phase 2 feature work. They slot numerically after core Phase 1 (T-015) and precede Phase 2 (T-020+).

| ID    | Task                                                                           | Type | Dependencies | Deliverable                                          | Validation                                                                               |
| ----- | ------------------------------------------------------------------------------ | ---- | ------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| T-016 | Shared strict test utilities (typed API helpers, JSON parsing, auth bootstrap) | QA   | T-009, T-015 | `packages/test-utils` (or folder) + refactored tests | Existing integration tests refactored to use helpers; lint passes with no disabled rules |
| T-017 | OpenAPI schema lint + CI drift check                                           | INF  | T-009        | Spectral config + CI step                            | CI fails if spec invalid or missing required fields; `/openapi.json` responds 200        |
| T-018 | Environment & config schema (zod-based) central module                         | BE   | T-012        | `config` module exporting validated env              | Running app with missing var shows clear error; unit test covers invalid env             |
| T-019 | Developer guide & runbook (startup, tests, troubleshooting)                    | DOC  | T-012        | `docs/developer-guide.md`                            | New contributor can follow steps to run lint, typecheck, tests successfully (spot check) |

---

## Phase 1 Completion Summary (Added v1.0 Close-Out)

Status: ALL Phase 1 core tasks (T-001–T-015) and bridge hardening tasks (T-016–T-019) are COMPLETE.

### Evidence Snapshot

- Lint: passes with zero warnings (strict ESLint scope limited to `apps/*/src` & `packages/*/src`).
- Typecheck: `pnpm typecheck` succeeds (project references updated for new packages `@budget/config`, `@budget/test-utils`).
- Tests: All unit & integration tests green (auth, tokens, groups, API endpoints, logging, config schema, desktop preload, web auth flow, test-utils placeholder).
- Electron Smoke: CI step launches packaged desktop build and validates `desktop.didFinishLoad` event.
- OpenAPI Spec: Enhanced with `servers`, `tags`, `operationId`, descriptions; Spectral lint passes (T-017) and CI step added.
- Config Schema: `@budget/config` validates env (JWT secret length, TTLs); invalid scenario test included (T-018).
- Developer Guide: `docs/developer-guide.md` created with scripts, troubleshooting, and contributor onboarding (T-019).
- Logging & Error Handling: Structured JSON logs with traceId; standardized error shape validated by integration test (T-014, T-015).

### Notable Adjustments During Close-Out

- Introduced `@budget/test-utils` but trimmed scope to avoid circular build; helpers provide request utilities without owning server construction.
- Added minimal tests for packages lacking coverage (logging, config, test-utils) to keep global test run fully green.
- Added Spectral config `.spectral.json` and build/dump script (`tools/openapi-dump.cjs`) plus `spec:lint` script; spec now enriched to meet lint rules.
- Centralized configuration moved from inline constants in `server.ts` to `@budget/config` with cached load and test reset.

### Current Technical Debt / Follow-Ups (Pre-Phase 2)

- Test-utils could later re-introduce a context builder once API evolves (avoid re-adding circular dependency).
- Refresh token reuse detection still deferred (not in Phase 1 scope) – slated for future security enhancement.
- OpenAPI schemas are still simplified (no detailed error component schemas); expand when Phase 2 adds new domains.
- Consider pruning committed generated files (`openapi.generated.json`, `.spectral-report.json`) or mark them in `.gitignore` if not required as artifacts.

### Readiness for Phase 2

The codebase is stable with baseline auth, group management, logging, config validation, and CI quality gates. Ready to proceed to Phase 2 Task T-020 (Aggregator decision ADR) without prerequisite gaps.

---

## Phase 2: Accounts & Transactions (Months 2–4)

### Goal Exit Criteria

Link bank via aggregator sandbox, pull transactions, store & list with basic filtering; budgets minimal; performance baseline.

| ID    | Task                                                            | Type  | Dependencies | Deliverable                  | Validation                            |
| ----- | --------------------------------------------------------------- | ----- | ------------ | ---------------------------- | ------------------------------------- |
| T-020 | Choose initial aggregator (decision record)                     | SEC   | T-013        | ADR in `docs/adr/`           | ADR merged, referenced                |
| T-021 | Aggregator abstraction interface (ProviderAdapter)              | BE    | T-020        | Interface + mock impl        | Unit tests with mock provider         |
| T-022 | Plaid/Stripe sandbox client integration (token exchange)        | BE    | T-021        | Provider module + env config | Sandbox token exchange test           |
| T-023 | Secure storage (encrypted) for access tokens                    | BE    | T-022        | Vault service + migration    | Stored ciphertext differs from plain  |
| T-024 | Link flow frontend (launch widget, receive public token)        | FE    | T-022        | UI component + state         | Manual sandbox link success           |
| T-025 | Accounts ingestion + persistence (/accounts sync)               | BE    | T-022        | Endpoint + mapping tests     | Account list matches provider sandbox |
| T-026 | Nightly sync job skeleton (scheduler + placeholder)             | BE    | T-025        | Worker process script        | Cron trigger dry-run log              |
| T-027 | Transactions fetch & persistence (initial full sync)            | BE    | T-025        | Endpoint + mapping           | Data row count >0 after link          |
| T-028 | Transaction list API (pagination, basic filters)                | BE    | T-027        | Controller + repo tests      | Filter tests pass                     |
| T-029 | Transaction list UI (infinite scroll/pagination)                | FE    | T-028        | Component + query hooks      | Manual scroll loads pages             |
| T-030 | Auto-categorization placeholder (provider category passthrough) | BE    | T-028        | Category assignment logic    | Unit test asserts mapping             |
| T-031 | Manual category edit UI + API                                   | FE/BE | T-030        | PATCH endpoint + form        | Edit persists + reflected on refresh  |
| T-032 | Budget entities (Category, BudgetPeriod, Allocation) migrations | BE    | T-005        | Migrations + models          | Migration apply success               |
| T-033 | Budget creation API & validation                                | BE    | T-032        | Endpoint + zod schema        | Unit + integration tests green        |
| T-034 | Budget list & per-category spent computation                    | BE    | T-033, T-027 | Service + tests              | Computation matches fixture data      |
| T-035 | Budget dashboard UI (progress bars, color coding)               | FE    | T-034        | React components             | Visual thresholds correct (storybook) |
| T-036 | Performance baseline tests (transaction list, budget dashboard) | QA    | T-029, T-035 | Scripted load test           | P95 timings recorded < targets        |
| T-037 | OpenAPI/Swagger doc generation & publish route                  | BE    | T-028        | Swagger config file          | Spec accessible at /docs              |
| T-038 | Access control regression tests (transactions isolation)        | QA    | T-028        | Test suite                   | Unauthorized access 403               |

### Phase 2 Exit Validation

- Sandbox account link → transactions visible in UI within <2 min manual refresh.
- Budgets display spent % with color thresholds.
- P95 perf metrics recorded and within provisional targets.

---

## Phase 3: Offline & Sync (Months 4–5)

### Goal Exit Criteria

Desktop offline viewing + mutation queue with auto replay; conflict handling; manual transactions.

| ID    | Task                                                                               | Type    | Dependencies | Deliverable                         | Validation                                |
| ----- | ---------------------------------------------------------------------------------- | ------- | ------------ | ----------------------------------- | ----------------------------------------- |
| T-050 | Local storage abstraction (IndexedDB/SQLite adapter)                               | SYNC    | T-011        | Adapter + tests (CRUD)              | Insert/read/update/delete tests           |
| T-051 | Entity cache seeding on login (accounts, categories, budgets, recent transactions) | SYNC    | T-050, T-034 | Sync bootstrap code                 | Offline toggle shows cached data          |
| T-052 | Offline detection hook & UI indicator                                              | FE/DS   | T-051        | Component + icon                    | Simulated offline shows indicator         |
| T-053 | Mutation queue schema & persistence (operations table)                             | SYNC    | T-050        | Schema + writer tests               | Queued ops survive restart                |
| T-054 | Operation idempotency key generation (UUID v7) lib                                 | SYNC    | T-053        | Utility + tests                     | Duplicate submit ignored server-side      |
| T-055 | Replay worker (online flush, exponential backoff)                                  | SYNC    | T-054        | Worker module + tests (mock server) | Queued ops drained after reconnect        |
| T-056 | Conflict detection (version compare) server-side                                   | BE      | T-028        | Version column logic + tests        | Simulated conflict returns server version |
| T-057 | Conflict resolution client (latest wins + log)                                     | SYNC    | T-056, T-055 | Handler + log entry                 | Conflict event logged                     |
| T-058 | Manual transaction entry offline (UI + queue)                                      | FE/SYNC | T-055        | Form + queue integration            | Offline add appears & later persists      |
| T-059 | Data loss resilience test plan & execution                                         | QA      | T-058        | Test report                         | No lost ops after forced quit             |
| T-060 | Sync metrics (queue depth, flush latency) exported                                 | OPS     | T-055        | Metrics counters                    | Metrics visible in dashboard              |

### Phase 3 Exit Validation

- Create transaction offline, restart app, reconnect → transaction in server within 30s.
- Conflict scenario test passes (newer version retained).
- Queue depth returns to zero at steady state.

---

## Phase 4: Advanced Features & Compliance (Months 5–6)

### Goal Exit Criteria

Reporting, family sharing, notifications, export/delete privacy flows, audit logging, refined budgets.

| ID    | Task                                                    | Type  | Dependencies | Deliverable                | Validation                           |
| ----- | ------------------------------------------------------- | ----- | ------------ | -------------------------- | ------------------------------------ |
| T-080 | Family invite email send (SendGrid integration)         | BE    | T-008        | Email service + template   | Email received in sandbox            |
| T-081 | Group context switching UI & access scoping             | FE    | T-080        | Selector component         | Switching filters data set           |
| T-082 | Private data flag groundwork (schema field, hidden UI)  | BE    | T-081        | Field + test (hidden)      | Field present, unused                |
| T-083 | Reporting service (aggregations: category, time series) | BE    | T-027        | Query layer + tests        | Aggregations match fixtures          |
| T-084 | Reports UI (charts)                                     | FE    | T-083        | Components (lazy-loaded)   | Charts render sample data            |
| T-085 | Notification settings schema & API                      | BE    | T-033        | CRUD endpoints + tests     | Threshold persisted                  |
| T-086 | Budget threshold evaluation job (daily)                 | BE    | T-085        | Worker + tests             | Simulated over-threshold sends event |
| T-087 | Email alert templates (overspend)                       | BE    | T-086        | Template + test (snapshot) | Email content contains metrics       |
| T-088 | Data export job & signed URL delivery                   | BE    | T-037        | Job + storage + test       | Export file downloadable             |
| T-089 | Data deletion request workflow (soft delete → purge)    | BE    | T-088        | API + background task      | Deletion test ensures purge          |
| T-090 | Audit log expansion (invites, token exchange, deletion) | BE    | T-089        | Log entries + tests        | Events recorded                      |
| T-091 | Accessibility audit & remediations                      | FE    | T-084        | Audit report               | Axe tests pass key flows             |
| T-092 | Budget revision history schema + UI diff view           | BE/FE | T-035        | History table + component  | Revision list displays entries       |
| T-093 | OpenAPI spec completeness & publish version 1.0         | BE    | T-090        | Tagged spec                | Lint passes; doc site updated        |

### Phase 4 Exit Validation

- Overspend alert email triggered in test scenario.
- User export & deletion flows succeed inside SLA test window.
- Reports show correct aggregates vs controlled dataset.

---

## Phase 5: Beta Hardening (Month 7)

### Goal Exit Criteria

Performance tuning, security review, penetration test fixes, stability for launch.

| ID    | Task                                                       | Type | Dependencies | Deliverable              | Validation                        |
| ----- | ---------------------------------------------------------- | ---- | ------------ | ------------------------ | --------------------------------- |
| T-110 | Load/perf tests high-volume (50k txns)                     | QA   | T-083        | JMeter/k6 scripts        | P95 endpoints < targets           |
| T-111 | Index tuning & query optimization                          | BE   | T-110        | Migration adding indexes | Reduced query latency stats       |
| T-112 | Security static scan (SAST) integration                    | SEC  | T-012        | CI step + report         | No critical unresolved vulns      |
| T-113 | Dependency vulnerability management (audit + policy)       | SEC  | T-112        | Automated audit step     | Failing build on critical vuln    |
| T-114 | Pen test remediation tasks batch                           | SEC  | T-112        | Fix commits              | Pen retest confirms issues closed |
| T-115 | Crash/error monitoring thresholds & alerting               | OPS  | T-090        | Alerts config            | Simulated error triggers alert    |
| T-116 | Final privacy policy & terms page integration              | DOC  | T-089        | Markdown + route         | Page accessible & versioned       |
| T-117 | Beta tester instrumentation (feature flags, usage metrics) | OPS  | T-115        | Flags + dashboards       | Metrics populated                 |
| T-118 | Release readiness checklist completion                     | DOC  | T-117        | Checklist doc            | Signed off by leads               |

### Phase 5 Exit Validation

- All critical/high security findings resolved.
- Performance targets met on largest test dataset.

---

## Phase 6: Launch (Month 8)

### Goal Exit Criteria

Signed installers published, production infra live, monitoring & rollback in place.

| ID    | Task                                                         | Type | Dependencies | Deliverable                 | Validation                 |
| ----- | ------------------------------------------------------------ | ---- | ------------ | --------------------------- | -------------------------- |
| T-130 | Production infra provisioning (DB, app nodes, secrets vault) | INF  | T-110        | Terraform/infra scripts     | Plan & apply succeed       |
| T-131 | Production build & artifact pipeline (Electron builder)      | DS   | T-011        | Build scripts, code signing | Signed binaries verify OK  |
| T-132 | Auto-update channel configuration                            | DS   | T-131        | Update server config        | Test update flow works     |
| T-133 | Domain + TLS certs + CDN setup                               | INF  | T-130        | DNS + cert issuance         | HTTPS passes SSL test      |
| T-134 | WAF/rate limiting configuration                              | SEC  | T-133        | Rules + test logs           | Excess requests throttled  |
| T-135 | Run final launch smoke test script                           | QA   | T-134        | Script + report             | All critical endpoints 200 |
| T-136 | Production data backup & restore rehearsal                   | INF  | T-130        | DR procedure doc            | Restore test successful    |
| T-137 | Launch go/no-go meeting & sign-off                           | DOC  | T-135        | Minutes + approval          | Approval recorded          |

### Phase 6 Exit Validation

- Installers downloadable & verified.
- Production smoke tests green.
- DR restore tested successfully.

---

## Phase 7+: Post-Launch Iteration

Backlog (prioritized later): second aggregator, budget rollover logic, mobile exploration, advanced classification, WebSocket live updates.

| ID    | Task                                                     | Type  | Dependencies | Deliverable               | Validation                      |
| ----- | -------------------------------------------------------- | ----- | ------------ | ------------------------- | ------------------------------- |
| T-150 | Aggregator provider abstraction extension (2nd provider) | BE    | T-021        | Adapter + tests           | Switch provider in config works |
| T-151 | Budget rollover implementation & UI                      | BE/FE | T-092        | Rollover calc + tests     | Rollover scenario test passes   |
| T-152 | Advanced categorization rules engine (heuristics)        | BE    | T-030        | Rule engine + tests       | Accuracy metrics on sample set  |
| T-153 | WebSocket push prototype (live updates)                  | BE/FE | T-028        | WS server + hook          | Live update test w/o refresh    |
| T-154 | Mobile (exploratory PWA enhancements)                    | FE    | T-153        | Manifest + service worker | Install & offline basic works   |

---

## Validation Matrix (Summary)

- Security: T-112, T-113, T-114, T-134
- Performance: T-036, T-110, T-111
- Offline/Sync: T-050–T-060
- Compliance (export/delete): T-088–T-089
- Observability: T-014, T-060, T-115, T-117
- Launch Readiness: T-130–T-137

## How to Use

1. Open an issue per task referencing ID (label by Type).
2. Keep PR scope ≤ ~400 LOC unless justified; include task ID in title.
3. After validation, update Status to DONE (future automation can parse table).
4. If requirement changes, update corresponding tasks and increment requirements doc version.

---

End of Task Breakdown v1.0
