# Implementation Plan: Browser 1024 Puzzle

**Branch**: `001-browser-1024-game` | **Date**: 2025-10-22 | **Spec**: `/specs/001-browser-1024-game/spec.md`
**Input**: Feature specification from `/specs/001-browser-1024-game/spec.md`

## Summary

Implement a deterministic browser-based 1024 puzzle with shared TypeScript engine and React UI layers that support keyboard and touch inputs, persist state between moves, emit telemetry, and meet accessibility/latency targets. Core logic will live in `packages/core`, be orchestrated by a session controller in `frontend/src/state`, and surfaced via animated, screen-reader-friendly components.

## Technical Context

- **Language/Version**: TypeScript 5.3+, leveraging modern ECMAScript modules.
- **Primary Dependencies**: Vite 5 build, React 18 UI, Zustand for lightweight session store (resolved via research.md).
- **Animation System**: CSS transform-based motion driven by requestAnimationFrame with spring-like easing via `framer-motion`'s `useSpring` utilities (see research.md for trade-off).
- **Storage/Persistence**: LocalStorage-backed snapshot serializer with in-memory fallback for non-persistent contexts.
- **Deterministic RNG**: Seeded PRNG adapter in `packages/core/random` with explicit seed + cursor tracked per move.
- **Input Handling**: Keyboard (arrows + WASD) via React event layer, touch gestures via pointer events normalized in `frontend/src/hooks/useSwipeInput.ts`.
- **Telemetry Transport**: Batched payloads buffered in memory and flushed with `navigator.sendBeacon` on move completion or unload (per research.md decision).
- **Testing Strategy**: Vitest for core engine, Playwright for keyboard/touch end-to-end, Storybook + Chromatic for visual regression, axe-core integration for accessibility assertions.
- **Performance Goals**: Maintain 16ms frame budget, <80ms p95 input-to-animation latency validated via Playwright trace analysis; degrade gracefully on low-power devices.
- **Accessibility & Localization**: ARIA live regions, focus management, high-contrast theme toggle, Mandarin strings mirrored from spec with English fallback.

## Constitution Check

- ✅ **Pure core engine**: Tile movement, merging, scoring, RNG sequencing, and undo stacks are implemented as pure functions within `packages/core`, exposed via typed command/result interfaces.
- ✅ **Seed management**: Session controller injects deterministic seed provider, logs seed + cursor per move, and exposes them to telemetry/export APIs.
- ✅ **Test gates**: Plan mandates Vitest specs for move resolution, undo, RNG distribution; Playwright flows for keyboard/touch; Storybook stories for states; axe-core + screen-reader audit scripts before merge.
- ✅ **Performance mitigations**: Animations use GPU-friendly transforms, event loop work is minimized via requestAnimationFrame batching, and telemetry batching prevents main-thread stalls.
- ✅ **Accessibility & telemetry mapping**: Live region announcements, focus ring preservation, restart control semantics, and telemetry payload schema (direction, score delta, board hash, latency, seed cursor) are enumerated for implementation tasks.

_Re-evaluated after design artifacts: checks remain satisfied with finalized architecture and contracts._

## Project Structure

```text
specs/001-browser-1024-game/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── gameplay.openapi.yaml
    └── telemetry.openapi.yaml
```

```text
packages/
├── core/
│   ├── src/engine/          # Pure movement/merge/resolution logic
│   ├── src/random/          # Seeded RNG provider + deterministic helpers
│   ├── src/events/          # Typed EngineEvent definitions
│   └── tests/               # Vitest specs for engine + RNG
├── shared/
│   ├── src/formatters/      # Score formatting, board hash utilities
│   ├── src/storage/         # LocalStorage adapters + guards
│   └── src/telemetry/       # Client-side telemetry payload builders
└── ui-telemetry/            # (New) lightweight abstraction for batching + sendBeacon

frontend/
├── src/
│   ├── components/          # React components for board, tiles, HUD, dialogs
│   ├── hooks/               # useKeyboardInput, useSwipeInput, useTelemetryQueue
│   ├── scenes/              # GameScene composition + overlays
│   ├── state/               # Zustand store bridging core engine + persistence
│   └── styles/              # High-contrast theme tokens + animations
└── tests/
    ├── interaction/         # Playwright keyboard/touch specs
    ├── accessibility/       # axe-core + screen-reader scripts
    └── performance/         # Trace assertions for latency budgets

tests/
├── unit/                    # Engine unit tests + snapshot fixtures
└── fixtures/                # Seeded board state JSON + RNG transcripts
```

**Structure Decision**: Retain monorepo layout with `packages/` for shared logic and `frontend/` for React shell. Introduce `packages/ui-telemetry` to isolate beacon batching, ensuring telemetry concerns stay decoupled from presentation while remaining reusable across future surfaces.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _None_    | -          | -                                    |
