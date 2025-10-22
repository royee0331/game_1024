# Implementation Plan: Mobile Browser Play Support

**Branch**: `002-support-mobile-play` | **Date**: 2025-10-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-support-mobile-play/spec.md`

## Summary

Extend the existing 1024 browser experience so that mobile players can rely on responsive touch gestures, accessible on-screen controls, and resilient session resume after orientation or backgrounding. The plan updates the input hooks and layout system in the React frontend, layers persistence hooks into the Zustand session store, and augments telemetry so mobile interactions remain observable without modifying the deterministic core engine.

## Technical Context

**Language/Version**: TypeScript 5.4 across the pnpm workspace
**Primary Dependencies**: React 18 UI, Zustand state store, `@browser-1024/core` engine, `@browser-1024/ui-telemetry`, Framer Motion animations
**Storage**: Local storage session snapshots via `@browser-1024/shared/storage/localSession`
**Testing**: Vitest (unit and store persistence), Playwright mobile emulation with Axe (interaction + accessibility), Storybook responsive visual baselines
**Target Platform**: Mobile browsers (Chrome 128+, Safari 17+, Firefox 129) using PointerEvents with safe-area insets
**Project Type**: React single-page application with shared TypeScript packages
**Performance Goals**: Maintain <120ms gesture-to-dispatch latency and 16ms animation frames while preserving existing 60 FPS budget
**Constraints**: Core engine remains pure, RNG is seeded through the session store, telemetry and accessibility hooks stay mandatory, and no new network services are introduced
**Scale/Scope**: Single-player board sessions with enhanced mobile input, layout, and telemetry metadata
**Gesture Handling**: PointerEvent-based detection with guarded passive listeners, TouchEvent fallback for Safari gesture cancellation (resolved via research)
**Viewport Layout Tokens**: Responsive CSS clamp tokens derived from `frontend/src/styles` plus a mobile breakpoint map stored in `packages/shared` (resolved via research)
**Telemetry Additions**: Extend `@browser-1024/ui-telemetry` move payloads with `deviceCategory`, `gestureType`, and `orientation` fields synchronized with analytics (resolved via research)

## Constitution Check

- Core engine remains unchanged; work is limited to `frontend/src/hooks/useSwipeInput.ts`, a new `useMobileViewport.ts`, layout components, and telemetry adapters so `packages/core` stays side-effect free.
- RNG injection continues via `useSessionStore`'s seeded PRNG; resume flow persists `seedCursor` and queued moves in shared storage without altering deterministic move resolution.
- Test strategy covers Vitest suites for persistence helpers (`packages/shared/storage`), Playwright specs under `frontend/tests/interaction/mobile/`, and Storybook responsive stories validating controls and layout.
- Performance guardrails rely on passive pointer listeners, `requestAnimationFrame` debouncing for orientation recalculation, and Playwright trace assertions to keep gesture recognition under the 120ms budget.
- Accessibility and telemetry enhancements add ARIA-labelled controls, VoiceOver announcements, and extended telemetry schemas within `@browser-1024/ui-telemetry` validated by unit tests.

## Project Structure

### Documentation (this feature)

```
specs/002-support-mobile-play/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
packages/
├── core/                # Pure engine (new deterministic tests only)
├── shared/              # Storage & device utilities (resume helpers)
└── ui-telemetry/        # Client telemetry schema updates

frontend/
├── src/
│   ├── components/
│   │   ├── MobileControls.tsx      # New on-screen directional pad
│   │   └── GameAnnouncements.tsx   # Extend for mobile resume messaging
│   ├── hooks/
│   │   ├── useSwipeInput.ts        # Update thresholds + multi-touch handling
│   │   └── useMobileViewport.ts    # New orientation + safe-area hook
│   ├── scenes/
│   │   └── GameScene.tsx           # Compose controls + layout slots
│   ├── state/
│   │   └── sessionStore.ts         # Resume queue + telemetry metadata
│   └── styles/
│       └── mobile.css              # Responsive tokens + clamp rules
├── tests/
│   └── interaction/mobile/         # Playwright specs for swipe/tap/orientation
└── stories/
    └── MobileControls.stories.tsx  # Storybook responsive coverage
```

**Structure Decision**: Build all mobile-specific presentation inside `frontend/src` so the deterministic engine stays untouched. Shared persistence logic lives in `packages/shared` for reuse and isolated testing, while telemetry schema updates occur in `packages/ui-telemetry` so both desktop and mobile emit consistent payloads.

## Complexity Tracking

No constitution waivers or additional complexity justifications required.
