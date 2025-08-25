# ADR 0002: API Client Generation Strategy (Flutter & TypeScript)

Date: 2025-08-25
Status: Accepted (2025-08-25)

Decision Drivers:

- Consistency between backend OpenAPI schema and frontend clients (TS & Dart)
- Developer velocity (scaffold types & endpoints quickly)
- Type safety & runtime validation alignment (zod usage in TS; nullability correctness in Dart)
- Bundle size / tree‑shaking impact
- Custom middleware (auth, logging, retry, offline queue) extensibility
- Multi-platform (web, desktop, mobile) HTTP constraints (CORS, isolates, background sync)
- Maintenance overhead & update workflow (CI automation, schema drift detection)

## Context

The monorepo defines the HTTP contract in `openapi.generated.json` (source of truth from backend composition). With the introduction of a Flutter frontend (ADR 0001 refactor direction), we need a strategy for generating strongly‑typed API clients for:

1. Existing TypeScript apps (`apps/web`, future service code) with zod runtime validation at boundaries.
2. New Flutter/Dart app (`apps/flutter_app`).
3. Potential future provider adapters or sync engine that may require generated DTO parity.

We must avoid hand‑maintaining duplicate request/response models, reduce drift risk, and preserve custom behaviors (auth headers, error mapping, retries, offline queue integration). Approach must not compromise security (e.g., accidental inclusion of secrets in generated code) and should integrate into CI to fail fast when schema changes aren't reflected in committed client code.

## Options

### Option A: openapi-typescript + zod + custom thin fetch wrapper (TS) & openapi-generator dart-dio for Flutter

Pros:

- `openapi-typescript` produces lightweight TS types; pair with handcrafted fetch wrapper adding zod parsing.
- Dart `openapi-generator` with `dart-dio-next` (or `dart-dio`) preset yields mature code incl. interceptors for auth & logging.
- Separation keeps generated code minimal; business logic resides in shared hand-written layer.
- Wide community usage; easy upgrades.
Cons:

- Two different toolchains (Node + Java generator) increases CI complexity.
- Regenerating Dart via Java CLI slower; contributors need JDK installed.
- Need manual alignment for error mapping conventions across languages.

### Option B: Orval (TS) for types + hooks & Chopper (Dart) with manual model mirroring (no generation for Dart)

Pros:

- Orval can emit React Query hooks accelerating web dev velocity.
- Chopper (Dart) keeps Dart code idiomatic and small (no giant generated SDK).
- Simpler Dart dependency footprint (no large generator).
Cons:

- Manual model mirroring in Dart reintroduces drift risk (primary problem to avoid).
- Duplicated effort writing Dart models & serialization.
- Orval less flexible for non-React consumers (e.g., Node services) unless dual config.

### Option C: Unified openapi-generator multi-language run (typescript-fetch + dart-dio) with shared config & post-processing script

Pros:

- Single generator invocation (matrix) ensures parity.
- Consistent naming/casing rules enforced by config.
- Built-in support for auth interceptors, nullable handling.
Cons:

- Generated TS `typescript-fetch` client is heavier than custom minimal wrapper; may duplicate runtime validation effort.
- Harder to inject zod runtime validation without forking templates.
- Potential larger bundle size for web due to generic runtime.

### Option D: OAS -> JSON Schema pipeline, then: ts-json-schema-generator + zod, and quicktype for Dart

Pros:

- Quicktype generates high-quality, concise Dart types from JSON Schema; fast.
- Full control over TS runtime validation (zod) via schema.
- No reliance on heavyweight openapi-generator for Dart.
Cons:

- Two-stage transform increases tooling complexity.
- quicktype requires careful config to keep naming stable; may miss some OAS nuances (oneOf/anyOf edges) requiring manual tweaks.
- Less standard than direct OpenAPI generators (onboarding cost).

### Option E: Manual hand-written Dart client + existing TS approach (openapi-typescript + zod)

Pros:

- Maximum control & minimal dependencies.
- Can optimize for offline sync patterns directly in client design.
Cons:

- High maintenance burden; high drift risk.
- Slows feature delivery; not scalable as endpoints grow.

## Evaluation Matrix (Qualitative)

| Criterion                    | A (openapi-ts + dart-dio) | B (Orval + manual Dart) | C (Unified openapi-gen) | D (Schema pipeline) | E (Manual) |
| ---------------------------- | ------------------------- | ------------------------ | ----------------------- | ------------------- | ---------- |
| Drift Risk                   | Low                       | High                     | Low                     | Medium              | High       |
| Dev Velocity (Initial)       | Strong                    | Moderate                 | Moderate                | Moderate            | Weak       |
| Dev Velocity (Ongoing)       | Strong                    | Weak                     | Moderate                | Moderate            | Weak       |
| Runtime Validation (TS)      | Strong (zod custom)       | Strong (Orval + zod)     | Moderate (needs extra)  | Strong (schema->zod)| n/a manual |
| Dart Idiomatic Code          | Strong (dio)              | Strong (handwritten)     | Moderate                | Strong              | Strong     |
| Tooling Complexity           | Moderate                  | Low/Moderate             | Moderate/High           | High                | Low        |
| Bundle Size (Web)            | Small                     | Small                    | Larger                  | Small               | Small      |
| Offline Integration Hooks    | Strong (custom layer)     | Strong (manual)          | Moderate                | Strong (custom)     | Strong     |
| CI Automation Ease           | Moderate                  | Easy (but drift risk)    | Moderate                | Complex             | Easy       |
| Onboarding Simplicity        | Moderate                  | Strong                   | Moderate                | Weak                | Weak       |

## Decision

Adopt Option A: `openapi-typescript` for TypeScript type generation + custom zod validating fetch wrapper, and `openapi-generator` (dart-dio-next) for Flutter.

## Rationale

Option A balances low drift risk, strong type safety, and keeps both language clients idiomatic. TS side remains lightweight and preserves current architectural mandate (runtime validation via zod at boundaries). Dart side leverages dio interceptors for auth headers, retry/backoff, and later offline queue injection without bespoke boilerplate. Dual toolchains are acceptable trade-off given reliability and community maturity; CI scripts can encapsulate complexity behind unified `pnpm gen:api` and a small shell wrapper invoking Java docker image if JDK not installed.

## Consequences

Positive:

- Rapid iteration when backend endpoints evolve.
- Clear extension points for auth, logging, offline queue.
- Minimal manual code surfaces lower bug probability.
Negative / Mitigations:

- Two tools to version: Pin versions in `tools/` script; add checksum test.
- Java dependency for contributors: Provide Docker-based generation script.
- Need to ensure consistent naming & enum handling: Add post-gen lint script verifying diff-free re-run.

## Implementation Plan Alignment

1. Add dev deps: `openapi-typescript`, `zod` (already), plus generation script at root.
2. Create `tools/scripts/gen-api-ts.mjs` invoking openapi-typescript -> output `packages/domain/src/generated/api-types.ts` (or dedicated `packages/api-client-ts/`).
3. Add validating wrapper `packages/api-client-ts/src/client.ts` consuming generated types & performing zod parse.
4. Add Dart generation script: `tools/scripts/gen-api-dart.sh` invoking dockerized `openapitools/openapi-generator-cli` with config to emit into `apps/flutter_app/lib/api/`.
5. Introduce CI job ensuring clean `git diff` after running both scripts.
6. Document workflow in `docs/developer-guide.md` & create ADR acceptance commit.

## Open Questions / Follow-Ups

- Location of generated TS code: co-locate with domain or isolate in separate package? (Leaning separate for clearer layering.)
- Should we template a shared error envelope type to harmonize error handling across clients? (Likely yes.)
- Whether to adopt `dart_mappable`/`freezed` on top of generated code or rely on generator output alone.

## Revisit Conditions

Reconsider if:

- Generator output causes unacceptable bundle bloat (>10% growth measured) or perf regression.
- Need arises for GraphQL or gRPC transport (would obsolete REST client strategy).
- openapi-typescript or openapi-generator produce sustained instability or unpatched security advisories.

## Status

Accepted; implementation kickoff scheduled. Tracking checklist:

- [ ] Add dev dependency `openapi-typescript` & generation script (gen-api-ts) (Task: REF-API-001)
- [ ] Create TS client wrapper with zod validation (REF-API-002)
- [ ] Add Docker-based dart generation script (REF-API-003)
- [ ] Wire CI job to run generation & fail on diff (REF-API-004)
- [ ] Documentation update in developer guide (REF-API-005)

Future enhancement candidates:

- Template shared error envelope across TS/Dart clients.
- Evaluate pruning unused TS operation types post-tree-shake metrics.
