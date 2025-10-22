# game_1024 Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-22

## Active Technologies
- TypeScript 5.4 across the pnpm workspace + React 18 UI, Zustand state store, `@browser-1024/core` engine, `@browser-1024/ui-telemetry`, Framer Motion animations (002-support-mobile-play)
- Local storage session snapshots via `@browser-1024/shared/storage/localSession` (002-support-mobile-play)

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
- 002-support-mobile-play: Added TypeScript 5.4 across the pnpm workspace + React 18 UI, Zustand state store, `@browser-1024/core` engine, `@browser-1024/ui-telemetry`, Framer Motion animations

- 001-speckit-plan: Added
- 2025-10-22: Refreshed README.md and this guideline with current contributor workflows.

<!-- MANUAL ADDITIONS START -->
### Maintainer Notes
- 2025-10-22: Keep README.md and AGENTS.md aligned when adding new workspace commands or packages.
<!-- MANUAL ADDITIONS END -->
