# ADR 0001: Aggregator Selection (T-020)

Date: 2025-08-14
Status: Accepted
Decision Drivers:

- Security & Compliance (token handling, SOC2 posture, PCI scope)
- Coverage (institution breadth, account & transaction enrichment fields)
- Sandbox Quality (realism, stability, rate limits)
- Cost (initial + scaling tiers; free sandbox limits)
- Complexity & Time-to-Integrate (SDK ergonomics, TypeScript types, web + desktop compatibility)
- Future Multi-Provider Strategy (abstraction fit, data normalization burden)
- Offline/Sync Roadmap Alignment (webhook vs polling, incremental sync support)

## Context

We must choose an initial financial data aggregator to link bank accounts, retrieve balances and transactions for Phase 2 tasks (Accounts & Transactions). The choice must align with a future multi-provider abstraction (T-021, T-150) and security baseline (T-013). Candidate providers considered:

1. Plaid
2. Stripe Financial Connections
3. Tink (EU focus)
4. MX

Primary geography for early users assumed US; emphasis on rapid developer velocity and rich transaction categorization.

## Options

### Option A: Plaid

Pros:

- Broad US coverage; mature APIs
- Rich transaction data (categories, location, pending status)
- Granular webhooks for incremental sync (new transactions, updates)
- Strong TypeScript community examples
- Established security/compliance posture
  Cons:
- Pricing can escalate; per-item + product-based
- Some institutions occasional MFA edge cases

### Option B: Stripe Financial Connections

Pros:

- Simple pricing; integrated if Stripe already used (future payments?)
- Strong auth + security track record
- Native Stripe dashboard integration
  Cons:
- Transaction & categorization depth more limited vs Plaid (currently)
- Webhook granularity less mature for incremental updates

### Option C: Tink

Pros:

- Strong EU coverage (PSD2)
- Good categorization in EU markets
  Cons:
- Limited US coverage (not aligned with initial geography)

### Option D: MX

Pros:

- Good data enrichment & categorization
- Coverage competitive in US
  Cons:
- More involved procurement/onboarding; slower initial integration velocity

## Evaluation Matrix (Qualitative)

| Criterion              | Plaid    | Stripe FC                     | Tink     | MX       |
| ---------------------- | -------- | ----------------------------- | -------- | -------- |
| US Coverage            | Strong   | Moderate                      | Weak     | Strong   |
| Transaction Enrichment | Strong   | Moderate                      | Moderate | Strong   |
| Webhooks Incremental   | Strong   | Moderate                      | Moderate | Strong   |
| Dev Velocity           | Strong   | Strong                        | Moderate | Moderate |
| Cost (Early)           | Moderate | Strong (if already on Stripe) | Moderate | Moderate |
| Multi-Provider Fit     | Strong   | Moderate                      | Moderate | Strong   |
| Sandbox Quality        | Strong   | Moderate                      | Moderate | Moderate |

## Decision

Adopt Plaid as the initial aggregator provider for Phase 2.

## Rationale

Plaid offers the most balanced combination of US coverage, webhook-driven incremental sync (essential for future offline/sync efficiency), strong enrichment for categorization prototypes (T-030), and robust developer tooling to accelerate T-022 through T-028. While Stripe FC could reduce costs and integrate with potential future payments, current transaction enrichment gaps risk additional internal work. Selecting Plaid now does not preclude adding Stripe or MX later (T-150) due to planned abstraction (T-021).

## Consequences

Positive:

- Accelerated delivery of account & transaction ingestion tasks (T-022–T-028)
- Reduced internal enrichment workload for early categorization (T-030)
- Clear webhook model supports future sync scheduling & conflict reduction
  Negative / Mitigations:
- Pricing escalation risk: Mitigate via abstraction for multi-provider, cost monitoring.
- Vendor lock-in perception: Mitigate by implementing provider interface (T-021) early with mock tests.
- Handling Plaid-specific field nuances: Normalize in adapter layer, keep domain clean.

## Implementation Plan Alignment

1. T-021: Define ProviderAdapter interface referencing Plaid’s needed methods (link token create, public token exchange, accounts get, transactions sync).
2. T-022: Plaid sandbox integration (link token -> public token -> access token exchange).
3. T-023: Encrypt & store Plaid access tokens (avoid logging; align with security baseline).
4. T-025/T-027: Use Plaid accounts & transactions endpoints; store cursor for incremental sync.
5. T-026: Nightly job evolves later to webhook-driven triggers (webhook receiver added in Phase 2 extension or early Phase 3 if needed).

## Open Questions / Follow-Ups

- Need to enumerate minimal set of Plaid products (e.g., Transactions) to enable cost control.
- Decide when to implement webhook receiver endpoint (could slot after T-028 if required earlier for freshness).
- Evaluate if we need a feature flag to allow swapping mock provider in dev vs Plaid.

## Revisit Conditions

Reconsider provider if:

- Plaid pricing model materially changes >25% projected cost.
- Coverage or stability issues block >2 critical institutions in early adopter set.
- Required future features (e.g., real-time pending transaction updates) underperform vs alternatives.

## Status

Proposed; to be marked Accepted once reviewed & merged.
