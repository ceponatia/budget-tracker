# BudgetPro Monorepo

Monorepo for the BudgetPro application (web + desktop + backend) per `docs/requirements.md` & `docs/tasks.md`.

## Structure (Initial Skeleton)
```
apps/                # Application entry points (web SPA, electron, later workers)
packages/            # Shared libraries (domain types, services, ui components)
tools/               # Build & dev scripts
docs/                # Requirements, ADRs, security & task docs (policy docs will live in .github/)
docs/adr/            # Architecture decision records (to be added starting T-020)
```
Current scaffold directories created per T-001. `.github/` (policy & workflow) will be added in a later governance task (not required by T-001 spec but referenced in plan and copilot instructions).

## Workspace
Initialized pnpm workspace (T-002). Root `pnpm-workspace.yaml` defines package globs. Root scripts are placeholders until tooling tasks (T-003+).

## Getting Started (Will Evolve)
1. Ensure Node.js LTS & pnpm installed.
2. Run `pnpm install` (after T-002 adds workspace config).
3. See upcoming tasks for service & app bootstrapping.

## Governance
- Strong typing & runtime validation at boundaries.
- No unchecked `any`; follow `.github/COPILOT_STEERING.md`.
- Each task references an ID from `docs/tasks.md`.

## Next Steps
Proceed with T-003 (TypeScript strict setup) then T-004 (linting + formatting).

---
Initial scaffold created for T-001; workspace config added T-002.
