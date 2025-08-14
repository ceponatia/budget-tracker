# Security Baseline (T-013)

Version: 0.1 (Phase 1)  
Scope: Auth, token lifecycle, secret handling, logging, Electron hardening.

## 1. Password Policy

| Aspect                  | Policy                               | Rationale                                        |
| ----------------------- | ------------------------------------ | ------------------------------------------------ |
| Minimum Length          | 12 chars                             | Resilient vs brute force (NIST 800-63B baseline) |
| Character Set           | Any printable (no forced complexity) | Usability; length > complexity                   |
| Storage                 | Argon2id hashed                      | Memory-hard & side‑channel resistant             |
| Argon2 Params (Phase 1) | m=19MB, t=2, p=1                     | Fast tests; will tune ↑ in Phase 5               |
| Rehash Policy           | On param upgrade                     | Enables forward security                         |

## 2. Token Model

| Token   | Format               | TTL           | Storage          | Notes                                  |
| ------- | -------------------- | ------------- | ---------------- | -------------------------------------- |
| Access  | JWT HS256            | 15m           | Not persisted    | Short-lived to limit breach window     |
| Refresh | Random 256-bit (hex) | 24h (Phase 1) | Hashed (SHA-256) | Rotated on use (detect reuse upcoming) |

Rotation: Refresh token invalidated (revoked) immediately upon refresh; new pair issued.  
Replay Mitigation: Future (Phase 2+) will add reuse detection -> session purge.

## 3. Secrets & Config

| Item                   | Handling                                               |
| ---------------------- | ------------------------------------------------------ |
| JWT Secret             | 32+ bytes random; dev placeholder only                 |
| Argon2 Params          | Configurable via env (future config schema T-018)      |
| DB / API Keys          | `.env` local only; not committed; injected in CI/CD    |
| Electron Build Secrets | Not embedded in renderer; preload only whitelists APIs |

Never log raw secrets or tokens. Refresh tokens never stored raw (only hashed).  
Access tokens appear only in Authorization header (not logged).

## 4. Logging (T-014)

Structured JSON with fields: ts, level, msg, traceId, fields.  
PII Redaction: Email addresses only logged at registration/login success intentionally omitted (we currently omit user object logs). Future: implement central redaction util.  
Error Logs: server errors (5xx) include stack (test env) but never credentials.

## 5. Electron Hardening

| Control          | Status                                            |
| ---------------- | ------------------------------------------------- |
| contextIsolation | Enabled                                           |
| sandbox          | Enabled                                           |
| preload surface  | Minimal (theme only)                              |
| remote module    | Not used                                          |
| External links   | Opened via `shell.openExternal` with deny default |

Future: CSP headers for loaded index.html after packaging; code signing at Phase 6.

## 6. Cryptography

| Function      | Algorithm         | Library   |
| ------------- | ----------------- | --------- |
| Password Hash | Argon2id          | argon2    |
| Access Token  | HMAC-SHA256 (JWT) | jose      |
| Refresh Hash  | SHA-256           | WebCrypto |

Planned Upgrade: Key rotation & KMS integration (Phase 5 security hardening).

## 7. Error Handling (T-015)

Standard response on error: `{ error: { code }, traceId }`.  
Client distinguishes retry vs auth issues via code & HTTP status.  
Generic `INTERNAL_ERROR` for unclassified 500s.

## 8. Threat Considerations

| Threat               | Mitigation                                    |
| -------------------- | --------------------------------------------- |
| Token theft          | Short access TTL + hashed refresh storage     |
| Password brute force | Argon2id memory hardness + length requirement |
| XSS (desktop)        | contextIsolation + minimal preload            |
| Log injection        | JSON structured logging                       |
| Replay refresh       | Rotation (reuse detection queued)             |

## 9. Roadmap (Security Items)

- T-018: Central config schema & required secret validation.
- Phase 2: Provider credential abstraction & vault storage.
- Phase 5: Static analysis + dependency audit CI steps (T-112–T-113).
- Phase 6: Code signing, auto-update integrity.

---

Document owner: Security/Platform. Update on parameter changes or new controls.
