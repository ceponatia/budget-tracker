# Contributing Guide

Thank you for investing time in improving this budgeting app. This document sets expectations for contributors and automation.

## Quick Start
```bash
git clone <repo-url> budget
cd budget
corepack enable # pnpm/yarn support
pnpm install
cp .env.example .env # fill in required vars
pnpm dev
```

## Project Pillars
- Security & Privacy first (financial data & PII).
- Offline-first experience with deterministic sync.
- Strong typing + rigorous testing.
- Small, reviewable changes.

## Development Workflow
1. Create an issue (or pick existing) & discuss approach if non-trivial.
2. Branch naming: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
3. Ensure: lint, typecheck, tests (unit+integration) pass locally.
4. Submit PR referencing issue `Fixes #123`.
5. Respond to review feedback quickly; keep rebases clean.

## Commit Convention (Conventional Commits)
Examples:
- `feat: add budget carry-over policy`
- `fix(sync): prevent duplicate transaction import`
- `chore(deps): bump prisma to 5.x`

### Scopes
Use scope for layer or package: `feat(domain):`, `fix(api):`, `perf(sync-engine):`.

## Code Style & Quality
- TypeScript strict mode mandatory.
- No `any` unless absolutely unavoidable; justify with inline comment.
- Use functional, side-effect free code for calculations.
- Prefer pure functions and dependency injection over singletons.
- Avoid premature optimization; document performance-sensitive assumptions.

## Testing
| Layer | Command | Notes |
|-------|---------|-------|
| Unit | `pnpm test:unit` | Domain logic & utilities |
| Integration | `pnpm test:integration` | DB + API (uses test containers) |
| E2E | `pnpm test:e2e` | Critical flows (login, link account, offline sync) |

Minimum thresholds enforced in CI (fail build if unmet). Add tests for all bug fixes reproducing root cause.

## Security Checklist (Per PR)
- [ ] No secrets committed (scan diff).
- [ ] Input validated (zod schemas) for new endpoints.
- [ ] Sensitive logs avoided (no tokens, raw PII).
- [ ] Proper error wrapping (no leaking provider internals).

## Performance Checklist (If Applicable)
- [ ] Transaction list paginated or streamed.
- [ ] No N+1 DB queries (use relation prefetch / joins).
- [ ] Bundle size impact assessed (analyze build output if adding large libs).

## Adding Dependencies
- Prefer well-maintained, typed libs.
- Evaluate license (MIT/Apache/BSD). No copyleft for core runtime without approval.
- Justify large (>50KB gzipped) client additions in PR description.

## Database Changes
1. Modify schema (Prisma / migrations).
2. Provide migration script & rollback plan.
3. Include tests for new constraints.
4. Document model changes in PR.

## Feature Flags
Use for risky or partial features. Implement server-driven flags with fallback defaults.

## Logging
- Use structured logger; include correlation ids.
- Log levels: `debug` (dev only), `info` (lifecycle events), `warn` (recoverable anomalies), `error` (failures). Avoid `console.log`.

## Internationalization (Preparation)
Wrap new user-facing strings with `t()` even if only English now.

## Documentation Expectations
- Update README or relevant MD docs for new features.
- Inline JSDoc for public functions / exported types.
- Architectural changes -> update `COPILOT_STEERING.md`.

## Handling Conflicts in Sync
If contributing to sync logic, write deterministic tests covering:
- Out-of-order operations.
- Conflict (simultaneous edits) resolution.
- Retry/backoff after transient failure.

## Review Guidelines (For Reviewers)
- Validate scope & adherence to architecture.
- Request tests for logic paths not covered.
- Ensure security/privacy considerations addressed.
- Encourage clarity: variable/function names, doc comments.

## Issue Labels
- `type:bug`, `type:feature`, `type:security`, `type:tech-debt`, `good-first-issue`.
- `priority:p0` (urgent) → `p3` (low).
- `area:frontend`, `area:backend`, `area:sync`, `area:provider`, `area:infra`.

## Releasing (Future)
Automated semantic release increments version based on merged commit types. Manual intervention for breaking changes until stable (v1.0.0).

## Responsible Disclosure
Report vulnerabilities privately (see SECURITY.md). Do not open public issues for security flaws.

## Community Standards
Be respectful, constructive, concise. Assume positive intent.

Happy budgeting & building!
