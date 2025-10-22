# Implementation Plan: Mobile Scoreboard Layout & Completion Prompt

**Branch**: `003-mobile-score-ui` | **Date**: 2025-10-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-mobile-score-ui/spec.md`

## Summary

Restructure the mobile heads-up display so score, best score, and move count stack with consistent spacing and accessible labels, then introduce a dedicated game completion modal that announces final metrics, traps focus, and exposes a restart action that seeds a fresh session while retaining the best score. The work stays in the React UI layer, leaning on existing Zustand session state and telemetry wiring without touching the deterministic engine.

## Technical Context

**Language/Version**: TypeScript 5.4 with React 18 function components
**Primary Dependencies**: Zustand session store (`frontend/src/state/sessionStore.ts`), shared score formatter `@shared/formatters/boardHash`, existing telemetry queue hook, Vite styling pipeline
**Storage**: Local session snapshot via `@shared/storage/localSession` for best score persistence and resume metadata
**Testing**: Vitest for store/view-model utilities, Playwright mobile interaction specs, Storybook or Playwright visual diffs for HUD layout snapshots, axe-core assertions via existing helpers
**Target Platform**: Mobile Chrome (Android) and Safari (iOS) in portrait and landscape, with desktop layout unchanged
**Project Type**: React single-page application with shared packages
**Performance Goals**: Maintain 60 FPS render loop, keep modal mount/dismount within <16ms frame budget, ensure HUD updates occur synchronously with engine move commits
**Constraints**: Engine state remains pure and unchanged; HUD and modal must consume store selectors without introducing side effects; accessibility strings remain localized; telemetry envelopes continue to emit via existing queue; safe-area awareness required for notched devices
**Scale/Scope**: Single-player board session UI refinements plus telemetry confirmation for restart events

## Constitution Check

- ✅ Core engine isolation: All updates target `frontend/src/components`, `frontend/src/scenes`, and CSS files; no mutations to `packages/core` ensuring engine purity remains intact.
- ✅ RNG and telemetry strategy: Restart flow will continue to call the existing `restart()` action that seeds via stored RNG; modal actions will emit the already defined `session.restart` telemetry envelope so seeds stay traceable.
- ✅ Test gates: Plan includes Playwright interaction specs for HUD layout, modal display, and restart flow, plus a Vitest unit for any new view-model helper formatting functions, satisfying unit + integration coverage prior to merge.
- ✅ Performance guardrails: Layout changes rely on CSS media queries and lightweight React components; modal uses CSS transitions only when idle, avoiding expensive effects and preserving 16ms frames.
- ✅ Accessibility & telemetry mapping: HUD labels gain `aria-labelledby` wiring, the modal traps focus, exposes localized text, and telemetry events are documented in contracts—meeting accessibility and observability obligations.

_Re-check after design_: No additional risks identified; planned artifacts uphold all gates without waivers.

## Project Structure

### Documentation (this feature)

```text
specs/003-mobile-score-ui/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── telemetry-session-restart.yaml
└── tasks.md (created by /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
└── src/
    ├── components/
    │   ├── Hud.tsx               # Update layout + aria associations
    │   ├── GameAnnouncements.tsx # Adjust messaging to defer to modal when game ends
    │   ├── GameOverModal.tsx     # New modal component encapsulating prompt UI
    │   └── MobileControls.tsx    # No changes but interacts with layout spacing
    ├── scenes/
    │   └── GameScene.tsx         # Mount modal, adjust header markup for stacked HUD
    ├── state/
    │   └── sessionStore.ts       # Ensure restart telemetry + modal state hooks
    ├── styles/
    │   ├── global.css            # Responsive HUD styles + modal shell styles
    │   └── mobile.css            # Safe-area padding adjustments for modal/HUD
    └── tests/
        ├── interaction/
        │   ├── mobile/hud-layout.spec.ts      # New Playwright spec covering stacked HUD
        │   ├── mobile/gameover-prompt.spec.ts # New Playwright spec verifying modal behavior
        │   └── mobile/gameover-restart.spec.ts# New Playwright spec for restart telemetry/focus
        └── visual/
            └── hud-mobile.story.tsx           # Optional Storybook snapshot updates
```

**Structure Decision**: Implementation stays within the existing `frontend/src` React surface, adding a dedicated `GameOverModal` component and mobile Playwright specs under `frontend/tests/interaction/mobile`. No new packages or engine changes are required; style updates remain in `frontend/src/styles` with responsive breakpoints.

## Complexity Tracking

No constitution waivers required; table intentionally left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|

