# Research Findings: Mobile Browser Play Support

## Decision 1: PointerEvent-first gesture handling with touch fallback
- **Decision**: Use PointerEvent listeners for swipe detection with a 60px threshold, passive `pointerdown`/`pointerup`, and `preventDefault` only inside `pointermove` when dispatching moves; fall back to TouchEvent cancel handling on Safari during rapid orientation changes.
- **Rationale**: PointerEvents unify mouse, pen, and touch under one API and are supported across target mobile browsers, allowing us to reuse existing swipe logic while tightening thresholds and guarding multi-touch. Passive listeners keep scrolling responsive, and the fallback ensures Safari 17 maintains reliability when pointer IDs reset on rotation.
- **Alternatives considered**:
  - TouchEvent-only handlers — rejected because Chrome/Firefox flag them as legacy and they complicate multi-pointer cancellation.
  - Hammer.js/external gesture library — rejected to avoid new dependencies and because our gestures are limited to four directions.
  - Increasing reliance on `wheel`/`keyboard` simulation — rejected since they do not help real touch interactions.

## Decision 2: Responsive layout via CSS clamp tokens and safe-area env vars
- **Decision**: Define mobile layout tokens (tile size, gutter, HUD spacing) with CSS `clamp()` using existing design variables, and apply `env(safe-area-inset-*)` padding inside a new `mobile.css` module plus a `useMobileViewport` hook to surface orientation state.
- **Rationale**: `clamp()` maintains readability from 320–768px without separate style sheets, and safe-area env vars keep controls clear of notches and gesture bars. A hook exposes orientation changes so React components can react without manual media query listeners.
- **Alternatives considered**:
  - Hard-coded pixel breakpoints — rejected because they fail on high-density screens and future foldables.
  - CSS-in-JS runtime recalculation — rejected to avoid performance overhead and divergence from existing stylesheets.
  - Canvas-based board rendering — rejected because it would bypass our accessible DOM tiles.

## Decision 3: Telemetry enrichment within existing move payload
- **Decision**: Extend `@browser-1024/ui-telemetry` move payloads with `deviceCategory`, `gestureType`, and `orientation` fields while reusing the existing `move.completed` event name.
- **Rationale**: Keeping one event stream simplifies dashboards and downstream processing. Additional fields are backward compatible and allow mobile-specific segmentation without a schema fork.
- **Alternatives considered**:
  - Publishing a new `mobile.move` event — rejected to avoid duplicating consumer dashboards and risking missed desktop metrics.
  - Logging orientation changes separately — rejected because orientation is most useful when attached to the move that occurred under that layout.
  - Inferring device category from user agent strings downstream — rejected as brittle and inconsistent across browsers.

## Decision 4: Session resume using Page Visibility API with queued commands
- **Decision**: Listen to `visibilitychange` and `pagehide` events to flush queued commands and persist RNG cursor plus resume timestamp through existing `localSession` helpers, exposing a resume toast via the announcements component when the tab returns to `visible`.
- **Rationale**: Page Visibility API is supported across target browsers and avoids polling timers. Persisting RNG cursor ensures deterministic continuity, and a toast meets the spec’s feedback requirement without modal interruptions.
- **Alternatives considered**:
  - Service Worker-based background sync — rejected because it introduces significant complexity and isn’t needed for local persistence.
  - Persisting on every gesture only — rejected since crashes during animation or orientation change could still lose queued commands.
  - Using `beforeunload` prompts — rejected for poor UX and limited support on mobile browsers.
