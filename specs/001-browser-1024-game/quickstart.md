# Quickstart: Browser 1024 Puzzle Feature

## Prerequisites
- Node.js 20+
- pnpm 8+
- Modern browser (Chrome, Firefox, Safari) for testing

## Install Dependencies
```bash
pnpm install
```

## Run Development Servers
- **Core engine tests**:
  ```bash
  pnpm --filter packages/core test --watch
  ```
- **Frontend dev server**:
  ```bash
  pnpm --filter frontend dev
  ```
- **Storybook**:
  ```bash
  pnpm --filter frontend storybook
  ```

## Execute Test Suites
- **Unit tests (Vitest)**:
  ```bash
  pnpm test:unit
  ```
- **Interaction tests (Playwright)**:
  ```bash
  pnpm test:e2e -- --project=chromium
  ```
- **Accessibility sweep**:
  ```bash
  pnpm test:a11y
  ```

## Seeded Fixtures
Fixture JSON files live under `tests/fixtures/`:
- `fixture-start-001.json`
- `fixture-midgame-002.json`
- `fixture-endgame-003.json`

Launch dev server with deterministic fixture via query string, e.g.:
```
http://localhost:5173/?fixture=fixture-start-001&seed=seed-alpha-221022
```

## Telemetry Sandbox
During development telemetry flushes to a local stub:
```bash
pnpm --filter packages/ui-telemetry dev:mock
```
This starts an Express mock that logs incoming batches for inspection.

## Build Production Bundle
```bash
pnpm build
```
Outputs optimized static assets under `frontend/dist` plus shared package builds.
