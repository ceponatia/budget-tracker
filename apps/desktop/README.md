# @budget/desktop (T-011)

Electron shell that hosts the existing React SPA.

## Dev

1. Run dev script: `pnpm --filter @budget/desktop dev` (auto starts Vite + Electron)
2. Window opens at localhost:5173.

## Production Build (simplified)

1. Build web: `pnpm --filter @budget/web build`
2. Build desktop: `pnpm --filter @budget/desktop build`
3. Start: `pnpm --filter @budget/desktop start`

Future: packaging, code signing (Phase 6 tasks).
