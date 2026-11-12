# Wander web

React 19 + TypeScript, built with Vite. Mobile-first single-page app; the UI text is Vietnamese. In production it is built to
`dist/` and served by the Spring Boot backend from the same origin (one Docker image).

## Layout

```
src/
  app/        app shell, tab bar, error boundary
  features/   one folder per feature: components/, hooks/, api/, model/, index.ts (discover, trips, collab, identity, onboarding, rating, settings, templates)
  shared/     api client, const (including the Vietnamese copy), hooks, lib, map helpers, router, state, ui components
  styles/     tokens.css: the single source of colors and spacing
e2e/          browser scenarios (Playwright core + Chrome/Edge) against the real backend
scripts/      screenshot and diagnostics scripts (not part of the build)
```

Dependencies point one way (`app -> features -> shared`) and ESLint (`eslint-plugin-boundaries`) enforces it. Conventions:
[`docs/architecture/frontend-standards.md`](../docs/architecture/frontend-standards.md) (Vietnamese).

## Commands (from `web/`; run `npm ci` here and in the repository root first)

```bash
npm run dev          # Vite on http://localhost:5173, /api proxied to the backend on 127.0.0.1:8787
npm run typecheck    # tsc
npm run lint         # eslint + stylelint
npm test             # node:test unit tests (src/**/*.test.ts)
npm run build        # tsc + vite build -> dist/
npm run e2e          # browser scenarios; needs a backend on a scratch database (use `make e2e` from the root)
```

`make e2e` (or `tools\dev.ps1 e2e`) builds everything, starts the backend on a dedicated `wander_e2e` database and runs the scenarios;
running `npm run e2e` directly is refused unless `WANDER_E2E_DB=wander_e2e` is set, so tests can never write to the development database.

## Notes

- All server calls go through `src/shared/api` and `src/features/*/api`; field names and error codes must match the backend.
- Catalog photos are WebP. Lists and cards use `thumbUrl` (480 px); detail views use `url` (1280 px). Trip covers store the stable
  photo `id`, not a file name.
- `web/public/assets/map-photos` holds 96 px map-marker thumbnails; they are content-hashed and generated, do not edit by hand.
