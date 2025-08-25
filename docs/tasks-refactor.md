# Refactor Task Breakdown (Flutter Migration & API Client Generation)

Derived from `plan.md` (Flutter refactor section) and ADR 0002 (API Client Generation). Complements `docs/tasks.md` without modifying historical Phase task numbering. Refactor tasks carry `REF-*` IDs and will be closed when cutover from Electron to Flutter is complete and generation pipeline is stable.

Legend:

- Status (initial): PENDING unless marked DONE
- Type: FLT (Flutter/UI), API (client generation), BE (backend adjustments), DOC (documentation), CLEAN (cleanup/deprecation), SYNC (offline/sync alignment), CI (pipeline)
- Mapping: Which original task(s) the refactor task extends or replaces (if any)

---

## High-Level Objectives

1. Introduce Flutter multi-platform app alongside existing Electron/React implementation.
2. Establish automated OpenAPI-driven client generation for TypeScript & Dart (ADR 0002 accepted).
3. Incrementally port feature surfaces (auth, accounts, transactions, budgets, reporting) with parity validation.
4. Implement offline cache & sync queue in Flutter (re-using Phase 3 concepts; may advance a subset earlier for mobile readiness).
5. Decommission Electron shell & related scripts once parity achieved and validated.

Cutover Criteria (must all be satisfied):

- All T-024, T-029, T-031, T-035 user-facing features available & tested in Flutter desktop build.
- Auth + token lifecycle (T-006/T-007) flows fully implemented in Flutter with secure storage.
- Transaction & budget views performance comparable (<= 10% regression in P95 against React baseline for representative datasets).
- Offline read + queued mutation prototype implemented (minimum: local cache of accounts + transactions + queued manual transaction add).
- CI pipeline includes generation diff checks and Flutter analyze/test steps.

---

## Tracking Summary

| ID             | Task Title                                                   | Type  | Mapping / Notes                               | Status |
| -------------- | ------------------------------------------------------------ | ----- | --------------------------------------------- | ------ |
| REF-FLT-001    | Flutter scaffold (material app shell)                         | FLT   | New (precedes any mapping)                    | DONE   |
| REF-API-001    | Add `openapi-typescript` dev dep & TS generation script       | API   | Supports T-017, T-037                         | PENDING|
| REF-API-002    | Create TS zod-validating fetch wrapper                        | API   | Extends boundary validation mandate           | PENDING|
| REF-API-003    | Dart client generation script (dockerized openapi-generator) | API   | ADR 0002                                      | PENDING|
| REF-API-004    | CI job: run generators & fail on diff                        | CI    | Extends T-017 drift guard                     | PENDING|
| REF-API-005    | Developer guide update (client generation workflow)          | DOC   | Extends T-019                                 | PENDING|
| REF-AUTH-001   | Flutter auth UI (login/register forms)                        | FLT   | Mirrors T-010 (React)                         | PENDING|
| REF-AUTH-002   | Token storage & refresh logic (secure storage)               | FLT   | Mirrors T-006/T-007                           | PENDING|
| REF-ACCT-001   | Accounts list view (Flutter)                                 | FLT   | Mirrors T-025 (data) + T-029 (UI list)        | PENDING|
| REF-TXN-001    | Transactions paginated/infinite list (Flutter)               | FLT   | Mirrors T-028/T-029                           | PENDING|
| REF-TXN-002    | Transaction category edit UI (Flutter)                       | FLT   | Mirrors T-031                                 | PENDING|
| REF-BUD-001    | Budget creation form & API integration (Flutter)             | FLT   | Mirrors T-033                                 | PENDING|
| REF-BUD-002    | Budget dashboard (progress bars)                             | FLT   | Mirrors T-035                                 | PENDING|
| REF-OFF-001    | Local cache foundation (isar/drift selection spike)          | SYNC  | Future T-050 precursor                        | PENDING|
| REF-OFF-002    | Seed cache on login (accounts + recent txns)                 | SYNC  | Mirrors T-051                                 | PENDING|
| REF-OFF-003    | Offline indicator component (Flutter)                        | FLT   | Mirrors T-052                                 | PENDING|
| REF-OFF-004    | Mutation queue (basic create transaction)                    | SYNC  | Mirrors T-053/T-055 subset                    | PENDING|
| REF-OFF-005    | Offline manual transaction entry                             | FLT   | Mirrors T-058                                 | PENDING|
| REF-PERF-001   | Performance parity benchmark (React vs Flutter)              | QA    | Extends T-036                                 | PENDING|
| REF-CLEAN-001  | Electron deprecation announcement doc                        | DOC   | New                                           | PENDING|
| REF-CLEAN-002  | Remove Electron build scripts & packages                     | CLEAN | After REF-CUTOVER approval                    | PENDING|
| REF-CLEAN-003  | Remove React-only UI code paths (if not reused)              | CLEAN | Post cutover                                  | PENDING|
| REF-CUTOVER    | Cutover readiness review & approval                          | DOC   | Depends on all parity tasks                   | PENDING|

---

## Detailed Task Descriptions

### REF-FLT-001 Flutter scaffold (DONE)

- Deliverable: `apps/flutter_app` with `pubspec.yaml`, `main.dart`. Analysis clean (`flutter analyze`).
- Validation: Commit present on `flutter-refactor` branch (sha documented in PR). (Completed 2025-08-25)

### REF-API-001 Add openapi-typescript & TS generation script

- Deliverable: `tools/scripts/gen-api-ts.mjs` generating `packages/api-client-ts/src/generated/types.ts`.
- Validation: `pnpm gen:api:ts` produces file; rerun yields no diff; typecheck passes.
- Notes: Pin generator version; include hash comment at top for drift detection.

### REF-API-002 Create TS zod-validating fetch wrapper

- Deliverable: `packages/api-client-ts/src/client.ts` exporting typed call helper with zod schemas derived from generated types (light manual layer or codegen template extension).
- Validation: Unit tests for success, 4xx error mapping, zod parse failure -> thrown structured AppError.

### REF-API-003 Dart client generation script

- Deliverable: `tools/scripts/gen-api-dart.sh` (docker-based) outputting into `apps/flutter_app/lib/api/`.
- Validation: `bash tools/scripts/gen-api-dart.sh` regenerates code with no diff; `flutter analyze` clean; basic smoke test hitting a stub endpoint compiles.
- Tooling: Use `openapitools/openapi-generator-cli` image pinned by digest.

### REF-API-004 CI job generation diff check

- Deliverable: GitHub Actions workflow step (extend existing CI) running both scripts, failing if `git diff --exit-code` non-zero.
- Validation: PR with intentional schema change without regen fails.

### REF-API-005 Developer guide update

- Deliverable: Section in `docs/developer-guide.md` detailing generation commands, troubleshooting, regeneration policy.
- Validation: New contributor can follow steps to generate clients successfully (spot check).

### REF-AUTH-001 Flutter auth UI

- Deliverable: Login & register screens, routing shell, form validation.
- Validation: Manual e2e (register -> login -> token stored) & widget tests for validation errors.

### REF-AUTH-002 Token storage & refresh logic

- Deliverable: Secure storage wrapper (platform adaptive) + interceptor adding Authorization header & performing refresh on 401 once.
- Validation: Unit test simulating expired token triggers refresh path; failure surfaces logout event.

### REF-ACCT-001 Accounts list view

- Deliverable: Responsive list (desktop & mobile preview) fetching via generated client; loading & error states.
- Validation: Integration test (mock HTTP) renders accounts; empty state message present.

### REF-TXN-001 Transactions paginated list

- Deliverable: Infinite scroll / pagination controller reusing backend paging (cursor or page params).
- Validation: Scroll test loads next page; performance baseline recorded.

### REF-TXN-002 Transaction category edit UI

- Deliverable: Inline edit or detail panel; optimistic update with rollback on failure.
- Validation: Unit test for optimistic state rollback; manual edit persists.

### REF-BUD-001 Budget creation form

- Deliverable: Form with validation (amount >0, period selection); submission via client.
- Validation: Form unit tests; creation reflected on list refresh.

### REF-BUD-002 Budget dashboard

- Deliverable: Progress indicators with color thresholds (e.g., <70% green, 70–90% amber, >90% red) consistent with React implementation.
- Validation: Visual test/story & unit tests mapping percentages to color tokens.

### REF-OFF-001 Local cache foundation

- Deliverable: Chosen persistence library (decision noted inline); abstraction interface for repositories (AccountsCache, TransactionsCache).
- Validation: CRUD tests for cache operations; serialization roundtrip.

### REF-OFF-002 Seed cache on login

- Deliverable: Bootstrap service fetching initial datasets then populating caches; exposes ready signal to UI.
- Validation: Offline (network disabled) immediately renders previously cached list after restart.

### REF-OFF-003 Offline indicator component

- Deliverable: Connectivity service + widget badge; supports manual test toggling.
- Validation: Simulated offline (forced failure of ping) updates indicator within threshold (<2s).

### REF-OFF-004 Mutation queue (basic create transaction)

- Deliverable: Queue persistence + retry with exponential backoff; single operation type (create transaction) to start.
- Validation: Offline add queued; on reconnect flushes successfully; test simulating transient 500 ensures retry.

### REF-OFF-005 Offline manual transaction entry

- Deliverable: Form integrated with queue; immediate optimistic UI display flagged as pending.
- Validation: After reconnect flush, pending flag removed; test ensures idempotency key prevents duplicate.

### REF-PERF-001 Performance parity benchmark

- Deliverable: Script capturing P95 render + list load metrics for React vs Flutter using representative dataset snapshot.
- Validation: Report stored under `docs/perf/`; Flutter within 10% threshold or improvement plan filed.

### REF-CLEAN-001 Electron deprecation announcement doc

- Deliverable: `docs/electron-deprecation.md` outlining timeline, final supported version, migration steps.
- Validation: Linked from README + PR description; doc lints.

### REF-CLEAN-002 Remove Electron build scripts & packages

- Deliverable: Deleted `apps/desktop` (or archived), removed related scripts from root `package.json` & CI.
- Preconditions: REF-CUTOVER approved.
- Validation: CI passes without Electron tasks; release pipeline unaffected.

### REF-CLEAN-003 Remove React-only UI code paths

- Deliverable: Delete unused React budget/transaction components if fully superseded; update docs.
- Validation: Tree search confirms removal; no references remain in code.

### REF-CUTOVER Cutover readiness review & approval

- Deliverable: Review document summarizing parity matrix, perf metrics, outstanding risks, approval sign-off.
- Validation: Maintainer sign-off recorded; triggers CLEAN tasks.

---

## Risk Log (Active During Refactor)

| Risk ID | Description                                    | Impact | Likelihood | Mitigation / Task Link                 |
| ------- | ---------------------------------------------- | ------ | ---------- | -------------------------------------- |
| R-FLT-1 | Flutter perf regression on large txn lists      | High   | Medium     | REF-PERF-001 + virtualization strategy |
| R-FLT-2 | Drift between TS & Dart clients                 | Medium | Low        | REF-API-004 CI diff gate               |
| R-FLT-3 | Secure storage inconsistencies across OS        | Medium | Medium     | REF-AUTH-002 test matrix               |
| R-FLT-4 | Offline queue data loss on abrupt termination   | High   | Medium     | REF-OFF-004 durability tests           |
| R-FLT-5 | Prolonged dual maintenance (Electron + Flutter) | Medium | Medium     | Aggressive timeline; cutover gating    |

---

## Completion Definition

Refactor considered complete when REF-CUTOVER is DONE and all CLEAN tasks are finalized. Post-completion, remaining improvements revert to normal task numbering (future Phase or backlog IDs) and this document can be archived.

---

End of Refactor Task Breakdown v1.0
