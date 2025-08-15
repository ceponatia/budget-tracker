# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Core Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                    # Start backend + web (and optionally electron)
pnpm --filter @budget/web dev      # Start web app only
pnpm --filter @budget/desktop dev  # Start desktop app only

# Build
pnpm build                  # Build web and desktop apps
pnpm --filter @budget/web build
pnpm --filter @budget/desktop build

# Testing
pnpm test                   # Run all tests (workspace-wide)
pnpm test:unit             # Unit tests (when available)
pnpm test:integration      # Integration tests (when available)
pnpm --filter <package> test  # Test specific package

# Code Quality
pnpm lint                   # ESLint on all source files (no warnings allowed)
pnpm lint:fix              # Auto-fix linting issues
pnpm format                # Format all files with Prettier
pnpm format:check          # Check formatting without changing files
pnpm typecheck             # TypeScript type checking (all packages)

# Validation & Spec
pnpm spec:lint             # Validate OpenAPI spec
pnpm config:check          # Validate environment variables against schema
```

## Architecture Overview

### Monorepo Structure

- **pnpm workspace** with packages linked via `@budget/*` namespace
- **apps/** - Application entry points
  - `web/` - React SPA with Vite
  - `desktop/` - Electron wrapper
- **packages/** - Shared libraries
  - `api/` - Backend API (Node.js)
  - `domain/` - Domain models and business logic
  - `provider/` - Banking provider abstraction (Plaid/Stripe)
  - `auth/` - Authentication logic
  - `config/` - Configuration and env validation
  - `vault/` - Secret management
  - `logging/` - Structured logging
  - `test-utils/` - Testing utilities
  - `tokens/` - JWT token management
  - `groups/` - Family group functionality

### Key Architectural Principles

1. **Strong Typing**: TypeScript strict mode everywhere, no unchecked `any`
2. **Runtime Validation**: Zod schemas at all API boundaries
3. **Provider Abstraction**: Banking providers behind unified interface
4. **Security First**: Encryption for secrets, JWT with refresh tokens, audit logging
5. **Offline-First**: Local cache with deterministic sync queue
6. **Layered Architecture**: Clear separation between domain, application, infrastructure, and interface layers

### Data Flow & Sync Strategy

- Each mutation creates a `SyncOperation` with idempotency key
- Background sync when online with exponential backoff
- Conflict resolution: latest write wins with conflict tracking
- All entities include audit fields: `createdAt`, `updatedAt`, `version`

### Security Requirements

- Password hashing: argon2id or bcrypt (cost >= 12)
- JWT access tokens (~15m) + refresh tokens (rotated)
- Provider tokens encrypted before storage
- Electron: `contextIsolation: true`, `nodeIntegration: false`
- Parameterized SQL only (ORM safe)
- Environment variables for secrets (never commit `.env`)

### Testing Strategy

- **Unit Tests**: Pure functions, domain rules (Vitest)
- **Integration Tests**: API endpoints, DB operations
- **E2E Tests**: Critical user flows (future: Playwright)
- Minimum coverage: 85% lines, 95% for critical domain logic

### Error Handling Pattern

- Discriminated union `AppError` types
- Never expose raw provider errors
- HTTP status mapping (ValidationError→422, NotFound→404, etc.)
- Structured logging with context (requestId, userId, component)

## Development Workflow

### Environment Setup

1. Copy `.env.example` to `.env`
2. Generate strong `JWT_SECRET`
3. Add provider credentials if testing aggregator flows
4. Run `pnpm config:check` to validate

### Adding New Features

1. Define types in `packages/domain`
2. Add runtime validation with Zod
3. Implement with tests alongside
4. Update OpenAPI spec if adding endpoints
5. Run full validation: `pnpm lint && pnpm typecheck && pnpm test`

### Git Workflow

- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`
- Reference task IDs from `docs/tasks.md` in commits
- Small PRs preferred (< 400 lines)
- All tests must pass before merge

## Important Files & References

- **Task tracking**: `docs/tasks.md` - Current implementation status
- **Security**: `docs/security-baseline.md` - Security requirements
- **Architecture decisions**: `docs/adr/` - ADR records
- **Policy documents**: `.github/COPILOT_STEERING.md`, `.github/CONTRIBUTING.md`
- **OpenAPI spec**: `packages/api/src/openapi.ts`
- **Config schema**: `packages/config/src/index.ts`

## Current Implementation Status

- Phase 1 foundations complete (T-001 through T-019)
- Core packages scaffolded with basic functionality
- Authentication, groups, and provider abstraction implemented
- OpenAPI spec with operationIds and validation
- Environment config validation in place
- Test utilities and developer guide available
