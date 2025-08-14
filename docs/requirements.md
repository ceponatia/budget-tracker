# Budget Application Requirements Specification

## 1. Overview
A cross-platform personal & family budgeting application (web + Electron desktop: Windows 11, macOS, Debian-based Linux) enabling secure aggregation of financial accounts, budgeting, offline data entry, synchronization, analytics, and compliance with U.S. financial data privacy and security regulations.

Working title: "BudgetPro" (final name TBD).

## 2. Goals & Success Criteria
- Broad bank coverage: Link major U.S. (and future international) institutions via aggregation APIs (initial: Plaid or Stripe Financial Connections) with ≥97% U.S. coverage.
- Accurate, near real‑time transaction & balance visibility (scheduled plus user-triggered sync; new data visible within 24h of availability at institution, typical <5 min on manual refresh).
- Robust budgeting & analytics supporting household collaboration (multi-user shared budgets) with <2s P95 latency for typical dashboard loads (<5k transactions dataset).
- Fully functional offline create/read/update for core entities (transactions, budgets, categories, notes) with eventual consistency; no data loss after reconnect; automatic background sync <30s after network restoration.
- Security & compliance: Encryption in transit & at rest; MFA optional; adherence to GLBA Safeguards principles, CCPA/CPRA user rights (access/export/delete); zero storage of raw bank credentials; auditable security program.
- Cross-platform desktop parity (feature gap ≤5% vs web) and auto-update adoption >90% of active desktop users within 14 days of release.

## 3. Stakeholders & Users
- Primary Users: Individuals, couples, families managing shared finances.
- Secondary: Internal ops/support staff, compliance auditors.
- External Integrations: Bank data aggregators (Plaid, Stripe FC), payment processor (Stripe Payments for subscriptions), email provider (SendGrid), error monitoring (Sentry), analytics/observability.

## 4. Scope
### In Scope (MVP + defined phases)
1. Secure user authentication (email/password, password reset, MFA opt-in) & family group accounts.
2. Bank account linking via one aggregator (Plaid or Stripe FC) sandbox → production.
3. Import & storage of accounts, balances, transactions; categorization (auto + manual override).
4. Budget categories & period budgets (monthly + custom start day); progress tracking and overspend indicators.
5. Manual transaction entry (including cash) & manual account placeholder.
6. Offline mode (desktop): local cache, queued mutations, sync engine, conflict resolution (latest-write wins + logging).
7. Reporting dashboards: spending by category, spending over time, income vs expense summary (initial chart set).
8. Family sharing: invite members, shared data model, optional privacy flags (post-MVP for private items).
9. Notifications: threshold alerts (e.g., ≥90% budget spent) via email (configurable).
10. Privacy & compliance features: data export (JSON), account deletion, consent & privacy notice display.
11. Desktop packaging & auto-update (Win, macOS, Linux). 
12. Observability: structured logging, error monitoring, audit logs for sensitive actions.

### Out of Scope (Initial Release)
- Mobile native apps (iOS/Android).
- Investment portfolio analytics beyond balance tracking.
- AI-based predictive budgeting or forecasting.
- Advanced rule-based transaction classification beyond simple heuristics.
- Multiple currency support (future consideration).
- In-app marketplace / financial product recommendations.

## 5. Constraints & Assumptions
- Tech stack: TypeScript across front & back; React SPA + Electron; Node.js API (Express/NestJS); PostgreSQL primary DB.
- Hosting: Cloud (AWS/Azure/GCP) with managed Postgres; HTTPS enforced.
- Data volume assumptions MVP: <50k transactions per user, <10 family members per group.
- Desktop offline store: IndexedDB or SQLite (via sql.js / better-sqlite3) abstracted behind sync engine.
- Conflicts rare; simple resolution acceptable; future enhancement could add field-level merge or user prompts.
- Cost control: Single aggregator initially; abstraction layer to allow second provider later.

## 6. Functional Requirements
### 6.1 Authentication & Authorization
FR-AUTH-1 Users can register with email & password; password hashed (bcrypt/argon2).
FR-AUTH-2 Users can enable MFA (TOTP) after onboarding.
FR-AUTH-3 Sessions via short-lived access token + refresh token; revocation on logout.
FR-AUTH-4 Family groups: owner can invite (email) others; invited users accept & gain access to shared data set.
FR-AUTH-5 Authorization enforced server-side per user/group boundary.

### 6.2 Account Aggregation
FR-AGG-1 User initiates link flow invoking aggregator-hosted widget; credentials never touch our servers.
FR-AGG-2 System exchanges public token → access token securely, storing encrypted token.
FR-AGG-3 Nightly scheduled sync fetches new transactions & balance deltas for all active linked accounts.
FR-AGG-4 User can trigger manual sync on demand (subject to provider rate limits; display status/spinner).
FR-AGG-5 Webhook ingestion updates accounts within 2 minutes of provider notification.
FR-AGG-6 Support manual (unlinked) accounts flagged as manual_source.

### 6.3 Transactions
FR-TXN-1 Store core fields: id, account_id, user/group id, date, posted_at, description, merchant, amount (signed), currency, category_id, original_category, pending_flag, source (aggregated|manual), created_at, updated_at, version.
FR-TXN-2 Auto-categorize on import using provider category or internal mapping; allow manual override.
FR-TXN-3 User can edit description, category, notes on any transaction they own.
FR-TXN-4 Manual transactions support attachments (future) – NOT MVP.
FR-TXN-5 Search/filter: by date range, amount range, merchant text, category, account, pending/cleared.
FR-TXN-6 P95 transaction list load (≤200 rows) within 1.5s with pagination/infinite scroll.

### 6.4 Budgets & Categories
FR-BUD-1 Users define categories (name, type: expense|income, color, is_archived).
FR-BUD-2 Users create period budgets (monthly default) with limit_amount, start_date, rollover flag (post-MVP).
FR-BUD-3 System computes spent_amount and remaining dynamically from categorized transactions.
FR-BUD-4 Visual indicators: color coding (green <75%, amber 75–99%, red ≥100%).
FR-BUD-5 Support editing budget amounts mid-period (revisions tracked via history table).

### 6.5 Reporting & Analytics
FR-REP-1 Provide Spending by Category pie/donut (current period & previous period comparison % delta).
FR-REP-2 Provide Spending Over Time line/bar (weekly or monthly aggregation selectable).
FR-REP-3 Provide Income vs Expense summary (net difference, trend arrow).
FR-REP-4 Provide Balance summary (sum balances of all accounts by type).
FR-REP-5 Export data (JSON) including transactions, accounts, budgets for user/group.

### 6.6 Offline Mode & Sync
FR-OFF-1 Desktop app detects connectivity changes (online/offline events) and updates UI indicator.
FR-OFF-2 While offline, reads served from local cache; mutations stored in durable local queue.
FR-OFF-3 On reconnect, queued mutations replay in order with idempotency keys (operation_id) to backend.
FR-OFF-4 Conflict detection: if server version > client version for same entity, keep newer (latest updated_at) and log conflict (FR-AUD-3); client notified unobtrusively (toast) (post-MVP toast optional).
FR-OFF-5 Sync cycle continues until local and remote divergence count = 0; progress shown (spinner / subtle badge).
FR-OFF-6 Data loss prevention: queued mutations persisted across app restarts (e.g., local IndexedDB/SQLite table).

### 6.7 Family / Multi-User
FR-FAM-1 Group owner can send invitation emails; token expires after 7 days.
FR-FAM-2 Members inherit access to shared accounts, budgets, transactions (except items flagged private_post_MVP).
FR-FAM-3 Audit who created/edited each entity (user_id on records, updated_by field optional).
FR-FAM-4 Remove member revokes access; transactions remain (attributed historically).

### 6.8 Notifications & Alerts
FR-NOT-1 Users opt-in per category for threshold alerts (default off).
FR-NOT-2 System sends alert when spent_amount / limit_amount crosses configured threshold.
FR-NOT-3 Daily digest (optional) summarizing key budget statuses.

### 6.9 Privacy & Compliance
FR-PRIV-1 Provide Privacy Policy & Terms acceptance at signup; store acceptance timestamp/version.
FR-PRIV-2 Data export endpoint available (async job; email link or direct download with signed URL).
FR-PRIV-3 Data deletion request triggers soft-delete then hard purge within 30 days; confirmation email sent.
FR-PRIV-4 Maintain audit log for privileged/sensitive actions (invitations, deletions, token exchanges).
FR-PRIV-5 Allow user to view connected institutions & revoke access (trigger token invalidation).

### 6.10 Desktop Application
FR-DESK-1 Electron shell loads same SPA; environment injection for local DB path & native modules.
FR-DESK-2 Auto-update checks daily & on launch; silent download + prompt (mac/win) / apply on restart.
FR-DESK-3 Code-signed binaries for Win (Authenticode), macOS (notarized), Linux (.AppImage/.deb signed if feasible).
FR-DESK-4 System tray or menu indicator for sync/offline state (icon color / badge) (P1 nice-to-have).

### 6.11 Observability & Operations
FR-AUD-1 Structured logs (JSON) for API requests (trace_id, user_id, latency, status).
FR-AUD-2 Error monitoring integration captures unhandled exceptions (frontend & backend) sans PII.
FR-AUD-3 Conflict & sync anomalies logged with entity id, versions, resolution.
FR-AUD-4 Security events (login, MFA enrollment, token refresh, failed login) audited.
FR-AUD-5 Metrics: request_rate, error_rate, p95_latency, sync_queue_depth, offline_mutation_count.

## 7. Non-Functional Requirements
NFR-PERF-1 API p95 latency <400ms for standard CRUD operations under baseline load.
NFR-PERF-2 Dashboard initial load (accounts + current period budgets + recent transactions) <2s p95 for <5k transactions.
NFR-RELI-1 Monthly uptime ≥99.5% (API) excluding scheduled maintenance.
NFR-RELI-2 RPO ≤24h (backups daily + PITR) and RTO ≤4h for primary DB disaster.
NFR-SEC-1 All secrets stored in managed secret vault; no secrets in repo or logs.
NFR-SEC-2 Encryption: TLS 1.2+ in transit; AES-256 (or provider-managed) at rest for DB & backups; app-level encryption for aggregator access tokens.
NFR-SEC-3 MFA adoption target ≥30% of active users after 6 months.
NFR-COMP-1 Annual security review; vulnerability remediation SLA: Critical <7 days, High <30 days.
NFR-USAB-1 Accessibility: WCAG 2.1 AA for core flows (navigation, forms, charts alt text).
NFR-USAB-2 Responsive UI for 1024px+ (desktop focus) but functional at 768px width (small laptop/tablet landscape).
NFR-MAINT-1 85%+ unit test coverage for domain & sync logic; critical paths integration-tested.
NFR-LOG-1 PII redaction for logs (names, emails, tokens) except hashed identifiers.
NFR-INT-1 Aggregator API failures handled with exponential backoff; user-facing status messaging.
NFR-SCAL-1 Horizontal scale to 10x initial load without architectural rewrite (stateless API, queue-based background jobs).

## 8. Data Model (High-Level Entities)
- User(id, email, password_hash, mfa_enabled, created_at, deleted_at, privacy_policy_version_accepted_at)
- FamilyGroup(id, owner_user_id, name)
- GroupMembership(id, group_id, user_id, role)
- Account(id, group_id, provider_type, provider_account_id, name, institution_name, type, subtype, mask, current_balance, currency, last_synced_at, access_revoked_at, manual_source boolean)
- Transaction(id, account_id, group_id, user_id_created, description, merchant, amount, currency, txn_date, posted_at, category_id, original_category, pending, source, notes, version, updated_at)
- Category(id, group_id, name, type, color, archived_at)
- BudgetPeriod(id, group_id, start_date, end_date, created_at)
- BudgetAllocation(id, budget_period_id, category_id, limit_amount, revision, created_at)
- SyncMutationQueue(id, entity_type, entity_id, operation, payload_hash, status, created_at)
- AccessTokenVault(id, account_id/provider_ref, cipher_text, created_at)
- AuditLog(id, user_id, action_type, entity_type, entity_id, metadata_json, created_at)
- NotificationSetting(id, group_id, category_id, threshold_percent, enabled)

## 9. API Endpoint Examples (Illustrative)
- POST /auth/register
- POST /auth/login
- POST /auth/mfa/enable (TOTP secret provisioning)
- POST /groups/:groupId/invite
- POST /accounts/link/token/exchange
- GET /accounts
- GET /transactions?start=YYYY-MM-DD&end=YYYY-MM-DD&category=...&q=...
- PATCH /transactions/:id
- POST /budgets/periods/:periodId/allocations
- GET /reports/spending/category?period=current
- GET /export (async job triggers)
- DELETE /user (data deletion request)

## 10. Sync Engine Behavior (Desktop)
1. Intercepts mutating actions; assigns operation_id (UUID v7) for idempotency; writes to local queue & applies optimistic update to local cache.
2. Background worker attempts flush when online: POST batched or individual operations with operation_id & version precondition.
3. Server responds with success (updated canonical version & timestamps) or conflict; conflict path fetches server entity & reconciles (client replaced if stale).
4. After successful flush of all pending, emits event to UI to clear offline badge.

## 11. Security & Compliance Controls Mapping (Abbrev.)
- Access Control: JWT + role (group ownership) + per-entity ownership checks.
- Data Encryption: DB native encryption + application-level encryption for third-party tokens.
- Secrets: Managed vault (e.g., AWS Secrets Manager) referenced via env at runtime.
- Backup: Automated daily snapshots + PITR.
- Audit: Append-only AuditLog table; immutable storage (WORM bucket) export monthly.
- Incident Response: Defined runbook (future doc) referencing alert thresholds.
- Privacy Requests: Queue-based processor ensures deletion/export SLA <30 days (target <7 days).

## 12. Release Phases & Milestones (Condensed)
Phase 1 (Months 0–1): Design, schema, wireframes, choose aggregator.
Phase 2 (Months 2–4): Auth, accounts link (sandbox), transactions, basic budgets, desktop shell.
Phase 3 (Months 4–5): Offline cache & sync, manual entries, conflict handling.
Phase 4 (Months 5–6): Reporting, family sharing, notifications, compliance endpoints, hardening.
Phase 5 (Month 7): Beta testing, security review, performance tuning.
Phase 6 (Month 8): Production launch (web + desktop builds signed & distributed).
Phase 7 (Post): Iterative improvements, second aggregator abstraction, mobile exploration.

## 13. Acceptance Criteria (Sample)
AC-1 User can link sandbox bank and see imported transactions within 2 minutes (manual refresh) – Phase 2.
AC-2 Creating a transaction offline syncs automatically within 30s of reconnect without duplication – Phase 3.
AC-3 Editing same budget offline and online results in server holding newer timestamp version; other side sees update after next sync – Phase 3.
AC-4 Budget overspend alert email delivered when threshold crossed in sync job – Phase 4.
AC-5 User export contains all entity types & is downloadable within 10 minutes for dataset ≤50k txns – Phase 4.
AC-6 Data deletion request removes personal data (non-aggregated, non-anonymized) and invalidates tokens – Phase 4/5.

## 14. Open Questions / Future Decisions
- Choose Plaid vs Stripe FC first (evaluate pricing & coverage; decision deadline Phase 1 week 3).
- Rollover budgets semantics (carry leftover vs cap) – defer to Post-MVP.
- Multi-currency support roadmap & representation (decimal vs bigint minor units) – revisit after initial launch.
- Advanced classification engine (ML) – backlog.
- Real-time push (WebSockets) for multi-user live updates vs polling – evaluate after baseline sync stability.

## 15. Risks & Mitigations
- Aggregator Rate Limits: Mitigation: backoff + webhooks + on-demand minimal fetch window.
- Offline Conflict Complexity: Keep v1 simple; log metrics to inform need for richer merges.
- Desktop App Size (Electron bloat): Optimize packaging, code splitting, lazy load heavy charts.
- Data Privacy Breach: Encrypt tokens, least privilege IAM, continuous dependency scanning.
- Schedule Slippage: Enforce phased scope, feature flags, prioritize critical path (auth, linking, budgets, offline).

## 16. Glossary
- Aggregator: Third-party API provider aggregating bank data (Plaid, Stripe FC).
- Budget Allocation: Amount assigned to a category for a budget period.
- Operation Id: Unique idempotency key for a queued offline mutation.
- Version: Incrementing or timestamp-based concurrency control field on mutable entities.

## 17. Approval & Change Control
Changes to requirements require product & engineering lead sign-off; substantive architecture/security scope changes also require compliance review. Track amendments with semantic versioning of this document (requirements vX.Y) and changelog entries.

---
End of Requirements Specification v1.0
