# Lint Remediation Knowledge Base

Purpose: Persistent record of notable ESLint issues encountered and how we fixed them (or plan to), to accelerate future remediation and avoid repeating mistakes. This is NOT a project roadmap (see `tasks.md` for feature work); it is a living technical reference focused on static analysis.

Last Updated: 2025-08-15

---

## Current Open Errors

None. `pnpm lint` reports 0 errors (2025-08-15 post-remediation).

---

## Closed Issues & Fix Patterns

| ID      | Context                                       | Original Pattern                                        | Resolution Pattern                                            | Notes / Rationale                                        |
| ------- | --------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- | ---------------------- | ----------------------------------------------------- |
| FIX-001 | Unused imports & implicit any (tests & utils) | Imports left over after refactor; implicit return types | Remove imports; add explicit function return types            | Prevents creeping `any` from test helpers.               |
| FIX-002 | Provider adapter unsafe casts                 | Direct `any` mapping from Plaid data                    | Cast via `unknown` then shape with typed interface; replace ` |                                                          | `with`??` for defaults | Safer narrowing avoids accidental falsey overrides.   |
| FIX-003 | Vault duplicate global declarations           | Multiple `declare global` for `atob`/`btoa` polyfill    | Single guarded polyfill + module-level helper                 | Eliminated duplicate identifier errors in TS.            |
| FIX-004 | Broad ESLint disable blocks                   | File-level `eslint-disable` for unsafe rules            | Localize disables or remove after typing improvements         | Keeps lint signal strong.                                |
| FIX-005 | Non-null assertions in provider tests         | `object!` access in mocks                               | Optional chaining + defined test data                         | Avoids runtime risk & unnecessary assertion suppression. |
| FIX-006 | Logical OR for default currency               | `currency                                               |                                                               | 'USD'`                                                   | `currency ?? 'USD'`    | Preserves empty-string as meaningful (if ever added). |

---

## Detailed Remediation Recipes

### 1. Safe Supertest Response Handling

Problem: Supertest chain returns `any` leading to unsafe assignment / member access in error branches.

Pattern Fix:

1. Capture thrown value as `unknown` in `try/catch`.
2. Narrow with a custom type guard:

```ts
function isResponseLike(v: unknown): v is { status: number; body?: unknown } {
  return typeof v === 'object' && v !== null && 'status' in v;
}
```

3. Use conditional expectations only after guard; otherwise rethrow or fail test with serialized value.

### 2. Eliminating Unnecessary `??`

Problem: `value ?? fallback` flagged when `value` type is non-nullable.

Fix Steps:

- Inspect TypeScript type; if not `T | null | undefined`, drop `?? fallback`.
- If value can legitimately be optional but type not reflecting that, update domain type instead of suppressing rule.

### 3. Replacing Residual `||` with `??`

Problem: `a || b` used for defaults; could incorrectly treat `''` or `0` as absent.

Fix Steps:

- Confirm semantics: if only `null` / `undefined` should trigger fallback → swap to `a ?? b`.
- If all falsy values are invalid (including `''`, `0`), retain `||` and add comment documenting intent to silence prefer-nullish-coalescing via allow option if justified.

### 4. Base64 Decode Safety Wrapper

Problem: `atob` returns `string`; direct usage leads to unsafe assignment.

Wrapper:

```ts
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
```

Use wrapper return type instead of intermediate `any` variable.

### 5. Scoped ESLint Disables

Preferred format:

```ts
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Reason: awaiting upstream type update (issue #123)
```

Avoid file-level `/* eslint-disable */` except in generated code.

---

## Pending Action Checklist

No pending remediation items. Future lint issues should add a new dated snapshot section rather than editing historical entries.

---

## Tooling Enhancements (Future)

- Add custom ESLint rule (or local util) to detect file-level `eslint-disable` lasting > N lines.
- Introduce typed test client wrapper that returns `Response`-shaped object with narrowed generics.
- Add lint script variant with `--fix` and CI diff detection to prevent incomplete manual fixes.

---

## Decision Log Fragments

- Choosing guard + narrow over casting for Supertest retains type safety and surfaces real API changes.
- Replacing `||` with `??` standardizes default semantics across provider code; documented to prevent regression.
- Vault wrapper centralizes base64 decode, paving way for switching to `Buffer.from(..., 'base64')` if Node-only path later.

---

## Removal Policy

When an issue category has been stable (no recurrence) for 60 days, its recipe can be collapsed into a shorter "Historical" section to keep this file concise.

---

End of knowledge base.
