# BudgetPro Monorepo

<!-- Replace with actual owner/repo once pushed -->

![CI](https://github.com/REPLACE_ME_OWNER/REPLACE_ME_REPO/actions/workflows/ci.yml/badge.svg)

Monorepo for the BudgetPro application (web + desktop + backend) per `docs/requirements.md` & `docs/tasks.md`.

## Structure

```text
apps/                # Application entry points (web SPA, electron, later workers)
packages/            # Shared libraries (domain types, services, ui components)
tools/               # Build & dev scripts
docs/                # Requirements, ADRs, security & task docs (policy docs will live in .github/)
docs/adr/            # Architecture decision records (to be added starting T-020)
```

Key backend change: the API server has been decomposed. `packages/api/src/app.ts` is the composition root (builds services + registers modular route groups: auth, groups, accounts, transactions, budgets). `packages/api/src/server.ts` is now a thin bootstrap that only creates the app and starts listening.

## Workspace

Initialized pnpm workspace (T-002). Root `pnpm-workspace.yaml` defines package globs. Root scripts are placeholders until tooling tasks (T-003+).

## Getting Started

1. Ensure Node.js LTS & pnpm installed.
2. Run `pnpm install` (after T-002 adds workspace config).
3. See upcoming tasks for service & app bootstrapping.

## Governance & Architecture

- Strong typing & runtime validation at boundaries.
- No unchecked `any`; follow `.github/COPILOT_STEERING.md`.
- Each task references an ID from `docs/tasks.md`.
- Security baseline: see `docs/security-baseline.md` (T-013).

## Testing

Root `pnpm test` runs all package `test` scripts. A forthcoming alias `test:unit` (see proposal below) will provide a focused fast path (only unit packages, excluding slower integration / e2e when introduced). For now, all tests are unit-level and run quickly (< few seconds total), so a separate alias is optional.

## Proposed Script Addition

Add at root `package.json`:

```json
"test:unit": "pnpm -r --workspace-concurrency=1 --filter ./packages/* --filter ./apps/* test"
```

Rationale: keeps parity with existing `test` while allowing future segmentation (e.g., introduce `test:integration` filtering API or Playwright specs, and let `test` invoke both).

## Next Steps

- Add `test:unit` + future `test:integration` split once integration/E2E layers widen.
- Evaluate extracting service construction from `app.ts` into discrete factory modules for easier unit substitution/mocking.

---

Initial scaffold created for T-001; workspace config added T-002. See `docs/developer-guide.md` for detailed contributor instructions. Updated for modular API (August 2025 refactor).
