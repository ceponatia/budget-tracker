# Temporary Lint Remediation Plan (Aug 2025)

Purpose: Track and resolve outstanding ESLint violations after Husky v9 migration and recent token service additions. This document is transient; merge fixes then fold concise summary back into `docs/tasks.md` (remove if noise).

## Current Status Snapshot

Last command: `pnpm lint` (see `lint7.out`).

Outstanding errors: 1

| File                                   | Rule                                               | Line (approx) | Description                                       | Planned Fix                                                                                             | Owner | Status  |
| -------------------------------------- | -------------------------------------------------- | ------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----- | ------- |
| `packages/tokens/src/token-service.ts` | `@typescript-eslint/no-unnecessary-type-assertion` | 38            | Unnecessary type assertion (does not change type) | Remove the redundant `as ...` or refactor expression; ensure resulting type remains inferred correctly. | AI    | PENDING |

Note: Source snapshot currently shows no obvious `as` assertion at or near that line; likely drift between lint artifact (`lint7.out`) and working tree. Need to re-run lint to confirm current error line and content before applying code change.

## Remediation Steps

1. Re-run lint to validate error still present and capture precise snippet.
2. If assertion remains: simplify expression by deleting the `as` clause; rely on TypeScript inference. If the assertion involved a library return (e.g., `jwtVerify` payload), replace with a type guard or explicit parse function instead of assertion.
3. Remove broad ESLint disable comments in `token-service.ts` by introducing narrow helper functions with typed return values (`buildAccessJwt`, `signJwt`). Add unit tests around token issuance & refresh verifying structure without unsafe suppressions.
4. Update `docs/tasks.md` Maintenance section: mark LINT-007 (new) as DONE after fix; remove obsolete entries when all lint issues cleared.
5. Delete this file (`lint-remediation-plan.md`) post-merge once tasks merged into canonical tasks doc.

## Proposed Additional Hardening (Optional)

- Replace generic `Error('INVALID_REFRESH')` with domain `AppError` once error module is centralized (future task reference T-015 extension).
- Remove top-of-file blanket disable: introduce minimal localized `// eslint-disable-next-line` with justification referencing issue ID.
- Introduce zod schema for access token payload shape to validate `sub` presence before casting.

## Exit Criteria

- `pnpm lint` exits 0 with no warnings.
- No blanket `eslint-disable` blocks in `token-service.ts`.
- Added or existing unit tests pass (`pnpm test:unit`).

---

Generated: 2025-08-15
