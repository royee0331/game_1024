# game_1024

A modern, accessible remake of the classic 1024 sliding-tile puzzle. The project is
a pnpm-managed monorepo that ships a Vite + React frontend, reusable game logic
packages, and Playwright end-to-end coverage to ensure the experience works
equally well on desktop keyboards and mobile touch devices.

## Repository layout

```
.
├── frontend/                # React application delivered through Vite
├── packages/
│   ├── core/                # Deterministic game engine and random tile helpers
│   ├── shared/              # Cross-package utilities (formatters, storage, etc.)
│   └── ui-telemetry/        # Client-side telemetry queue helpers
├── specs/                   # High-level product and UX design documents
├── tests/                   # Shared testing utilities and fixtures
└── AGENTS.md                # Development notes for contributors
```

## Prerequisites

- [Node.js](https://nodejs.org/) 20 LTS or newer.
- [pnpm](https://pnpm.io/) `8.15.8` (the workspace enforces this via
  `packageManager`).

Install dependencies once the prerequisites are available:

```bash
pnpm install
```

## Daily development

- **Start the app** – `pnpm dev` runs the Vite development server for the
  `frontend` package and exposes it on http://localhost:5173.
- **Storybook** – `pnpm --filter frontend storybook` launches an interactive
  component catalog on port 6006.
- **Type checking & builds** – `pnpm build` performs TypeScript project builds
  for every package in the workspace.
- **Linting** – `pnpm lint` executes ESLint across all source packages.

The `frontend/vite.config.ts` file defines path aliases (`@core`, `@shared`,
`@ui-telemetry`) so packages can be imported with stable module specifiers during
local development and Storybook sessions.

## Testing

- **Unit tests** – `pnpm test` runs Vitest suites across the workspace. Use
  `pnpm test:unit` to target the deterministic game engine found in
  `packages/core` only.
- **End-to-end tests** – `pnpm test:e2e` executes the Playwright scenarios wired
  to the `frontend/tests` folder. For mobile regression coverage you can run
  `pnpm --filter frontend test:e2e:mobile`.
- **Accessibility smoke tests** – Playwright integrates with `@axe-core` to
  flag regressions automatically when the e2e tests run.

## Key packages

- **`@browser-1024/core`** implements board state transitions, deterministic
  random tile placement, and emits telemetry events describing user moves.
- **`@browser-1024/shared`** offers utilities for formatting board hashes and
  persisting session snapshots to local storage so games can resume after
  refreshes.
- **`@browser-1024/ui-telemetry`** batches move telemetry and ships it via the
  browser beacon API, keeping the UI responsive on slower devices.

## Mobile HUD & completion modal

- The HUD now adapts between wide and stacked layouts, centering score,
  best score, and move count with ≥16px spacing on viewports ≤480px. The
  component is showcased in Storybook under **HUD → Stacked Mobile / Wide
  Desktop** for quick visual QA.
- A dedicated game-over modal surfaces final metrics, localized actions, and a
  manual focus trap. It emits a `session.restart` telemetry envelope before
  seeding the next session so analytics dashboards can distinguish restarts
  initiated from the modal vs. the persistent restart button.
- Playwright specs in `frontend/tests/interaction/mobile/` cover stacked HUD
  layout, modal timing, and restart flows to prevent regressions across mobile
  browsers.

## Additional resources

Specification documents under `specs/` provide historical context and acceptance
criteria for major milestones such as the initial browser release and the mobile
play experience. Contributors are encouraged to skim the relevant spec before
starting feature work.
