# Copilot Instructions

This repository includes comprehensive guidance documents to keep AI code generation aligned with architecture, security, compliance, and quality standards. Use this file as the single entry point.

## Primary References
| Purpose | File |
|---------|------|
| Architectural decisions, layering, sync model, strong typing rules | `./COPILOT_STEERING.md` |
| Contributor workflow, commit conventions, test expectations | `./CONTRIBUTING.md` |
| Security reporting & baseline controls | `./SECURITY.md` |
| PR structure & required checklists | `./PULL_REQUEST_TEMPLATE.md` |
| Issue creation formats | `./ISSUE_TEMPLATE/` |

## Core Mandates (Summarized)
1. Strong Typing: TypeScript strict mode, no unchecked `any`. Add zod runtime validation at boundaries.
2. Security First: Follow encryption, secret handling, and Electron hardening directives in `SECURITY.md` & `COPILOT_STEERING.md`.
3. Offline & Sync Integrity: Respect queue + conflict resolution strategy defined in steering guide.
4. Provider Abstraction: Do not couple business logic directly to Plaid / Stripe SDKs—use provider interface.
5. Tests with Logic: Every new domain/service function needs accompanying unit tests; new endpoints need integration tests.
6. Deterministic & Observable: Include structured logging, avoid hidden side effects.

## When Generating Code
- Read (and if needed, update) `COPILOT_STEERING.md` before introducing new architectural patterns.
- Reference domain types from a shared package (planned `packages/domain`). If absent, scaffold with explicit interfaces.
- Wrap external calls (banking APIs, persistence) in try/catch returning typed `Result` or throwing mapped `AppError`.
- Insert TODOs only with issue numbers `// TODO(#<id>): description`.
- Generate minimal viable tests concurrently (don’t defer).
- Enforce idempotency for sync mutations via operation IDs.

## Adding New Files (Checklist)
- Include header comment with purpose.
- Export explicit types & interfaces.
- Add tests + update any index barrels.
- Update docs if introducing: new entity, public endpoint, sync behavior.

## Common Pitfalls to Avoid
- Direct DB or provider access from React components (use services/hooks).
- Logging sensitive tokens or PII.
- Non-deterministic test reliance on real time (use fake timers).
- Large monolithic PRs (> ~400 LOC diff without justification).

## Decision Escalation
If a required pattern is missing or unclear:
1. Draft minimal proposal in PR description referencing relevant section (e.g., “Extends Sync Strategy – see COPILOT_STEERING.md: Offline & Sync Strategy”).
2. Update `COPILOT_STEERING.md` within same PR if decision becomes canonical.

## Quick Commands (See Detailed Set in COPILOT_STEERING.md)
```bash
pnpm install        # bootstrap
docker compose up db # (future) spin DB for local dev
pnpm dev            # start backend + web (and optionally electron)
pnpm test:unit      # unit tests
pnpm test:integration
pnpm lint && pnpm typecheck
```

## File Placement Guide (Intended)
- Backend API controllers / modules → `packages/api/src/...`
- Domain models & value objects → `packages/domain/src/...`
- Sync engine (client) → `packages/sync-engine/src/...`
- Provider adapters → `packages/provider/src/...`
- Frontend React UI → `apps/web/src/...`
- Electron main & preload → `apps/desktop/src/...`

## Update Process
Whenever architecture or policy changes:
1. Edit `COPILOT_STEERING.md`.
2. Reflect high-level shift here if it changes mandates or workflow.
3. Reference PR in changelog (future semantic release).

---
Copilot: Treat this directory (`.github/`) as authoritative policy. Always consult these documents before proposing structural or security-impacting changes.
