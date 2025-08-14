# Security Policy

Handling of financial & personal data demands stringent safeguards. This document outlines reporting, handling, and baseline protections.

## Supported Versions
Security fixes are applied to `main` and the latest minor release. Backports on a risk-based basis.

## Reporting a Vulnerability
1. Email: security@example.com (PGP key fingerprint: TBA) with detailed description.
2. Include: affected versions/commit, reproduction steps, potential impact, any logs or PoC.
3. Expect initial acknowledgment within 2 business days and status updates at least weekly.
4. Do NOT create a public issue for security vulnerabilities.

## Scope
In scope: application backend API, web frontend, Electron desktop app, sync engine, provider integration layer. Out of scope: third-party provider sandboxes (Plaid test environment), user-generated browser extensions.

## Handling Process
1. Triage & severity classification (CVSS v3.1).
2. Reproduce & create private issue.
3. Develop patch in private branch; add regression tests.
4. Coordinate release (may batch with other fixes unless actively exploited).
5. Credit reporter if desired upon disclosure.

## Baseline Security Controls
- MFA option for user accounts.
- Argon2id password hashing (tuned for ~250ms on baseline hardware).
- Short-lived JWT access tokens (<=15m) + refresh rotation.
- Encryption at rest for access tokens & sensitive PII (field-level / whole-disk cloud encryption).
- Principle of least privilege for service roles (DB, cloud IAM).
- TLS 1.2+ enforced for all network traffic.
- Strict Content Security Policy (CSP) & Electron hardening (no remote code execution vectors).
- Dependency vulnerability scanning (CI: `npm audit`, CodeQL, Dependabot weekly).
- Audit logging of sensitive operations (auth changes, data export, account link/unlink, deletion).

## Secure Development Requirements
- Input validation on all external interfaces (zod schemas).
- Output encoding for HTML contexts (React auto-escaping) – avoid `dangerouslySetInnerHTML`.
- Prepared statements / ORM safety (no manual SQL concatenation).
- Secrets excluded from git; `.env.example` template provided.
- Token & key rotation procedures documented (KMS managed keys).

## Cryptography Guidelines
- Randomness: use Node `crypto.randomUUID()` or `randomBytes`.
- Symmetric encryption: AES-256-GCM (libsodium / Node crypto) with unique nonce per message.
- Hashing (non-password): SHA-256 or BLAKE2b for integrity, never for password storage.
- Password reset tokens: high-entropy (>=128 bits) single-use, 15 min expiry.

## Vulnerability Classes to Prioritize
- Authentication bypass / privilege escalation.
- Injection (SQL, command, deserialization).
- XSS (DOM & reflected), CSRF (if cookies used; prefer Authorization header tokens).
- Insecure direct object references / missing access controls.
- Leakage of provider access tokens or PII in logs.
- Logic flaws in sync conflict resolution leading to data loss.

## Electron Specific
- `contextIsolation: true`, `nodeIntegration: false`.
- Validate IPC payload schemas; reject unknown channels.
- Disable `enableRemoteModule`.
- No loading of remote arbitrary content; all assets hashed/packaged.

## Incident Response (High-Level)
1. Detect: alert via monitoring / report.
2. Assess: classify severity; assemble response team.
3. Contain: disable affected feature / rotate credentials.
4. Eradicate: patch vulnerability; add tests.
5. Recover: deploy, verify logs normal.
6. Postmortem: documented within 5 business days (root cause, timeline, fix, prevention tasks).

## Responsible Disclosure Policy
We commit not to pursue legal action against researchers acting in good faith within this policy.

## Future Enhancements
- Formal threat modeling (STRIDE) per major release.
- Automated dependency license scanning.
- Static application security testing (Semgrep) baseline rules.

Thank you for helping keep users' financial data safe.
