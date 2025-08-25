# BudgetPro Flutter App

This directory contains the new Flutter refactor intended to replace the existing Electron (desktop) + web front-end over time.

## Goals

- Cross‑platform UI (iOS/Android/Desktop/Web) via Flutter.
- Reuse existing backend API contracts (`openapi.generated.json`) by generating Dart API clients.
- Implement offline cache & sync layer (e.g. using `drift` or `isar`) to parallel current offline requirements.

## Next Steps

1. Install Flutter SDK locally (<https://docs.flutter.dev/get-started/install>) and run:

   ```bash
   flutter pub get
   flutter run -d chrome # or linux / macos / windows once enabled
   ```

2. Introduce API client generation:
   - Add `openapi_generator` dev dependency.
   - Script to generate `lib/api/` from root `openapi.generated.json`.
3. Define domain models with `freezed` + `json_serializable` (mirroring TypeScript domain types).
4. Implement authentication flow + secure storage (e.g. `flutter_secure_storage`).
5. Add offline persistence (consider `isar` for speed or `drift` for SQL, with sync queue service).
6. Replace placeholder screen with actual navigation shell (e.g. `ShellRoute` with GoRouter or `NavigationRail`).

## Workspace Integration

This folder intentionally excluded from `pnpm-workspace.yaml` (Flutter uses its own tooling). Keep shared API schema at repo root for consistency. Consider CI job to verify generated Dart client is up-to-date with `openapi.generated.json`.

## Licensing / Attribution

Follow existing repository license and contribution guidelines.
