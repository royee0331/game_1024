# game_1024 Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-22

## Active Technologies
- TypeScript 5.4 across the pnpm workspace + React 18 UI, Zustand state store, `@browser-1024/core` engine, `@browser-1024/ui-telemetry`, Framer Motion animations (002-support-mobile-play)
- Local storage session snapshots via `@browser-1024/shared/storage/localSession` (002-support-mobile-play)
- TypeScript 5.4 with React 18 function components + Zustand session store (`frontend/src/state/sessionStore.ts`), shared score formatter `@shared/formatters/boardHash`, existing telemetry queue hook, Vite styling pipeline (003-mobile-score-ui)
- Local session snapshot via `@shared/storage/localSession` for best score persistence and resume metadata (003-mobile-score-ui)

- (001-speckit-plan)

## Project Structure

```text
frontend/
packages/
specs/
tests/
```

## Commands

- `pnpm dev` – Launches the Vite development server for the `frontend` package.
- `pnpm build` – Runs TypeScript project references and production builds for every workspace package.
- `pnpm lint` – Executes ESLint across all packages.
- `pnpm test` – Runs the full Vitest test matrix.
- `pnpm test:unit` – Executes deterministic engine tests scoped to `packages/core`.
- `pnpm test:e2e` – Runs the Playwright end-to-end suite for the frontend.
- `pnpm --filter frontend storybook` – Starts the component library explorer on port 6006.
- `pnpm --filter frontend test:e2e:mobile` – Executes the mobile-focused Playwright scenarios.

## Code Style

: Follow standard conventions
- Prefer TypeScript modules and named exports.
- Keep shared utilities framework-agnostic inside `packages/shared`.

## Recent Changes
- 003-mobile-score-ui: Added TypeScript 5.4 with React 18 function components + Zustand session store (`frontend/src/state/sessionStore.ts`), shared score formatter `@shared/formatters/boardHash`, existing telemetry queue hook, Vite styling pipeline
- 002-support-mobile-play: Added TypeScript 5.4 across the pnpm workspace + React 18 UI, Zustand state store, `@browser-1024/core` engine, `@browser-1024/ui-telemetry`, Framer Motion animations

- 001-speckit-plan: Added

<!-- MANUAL ADDITIONS START -->
### Maintainer Notes
- 2025-10-22: Keep README.md and AGENTS.md aligned when adding new workspace commands or packages.
<!-- MANUAL ADDITIONS END -->
