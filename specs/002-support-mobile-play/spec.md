# Feature Specification: Mobile Browser Play Support

**Feature Branch**: `002-support-mobile-play`
**Created**: 2025-10-22
**Status**: Draft
**Input**: User description: "在手浏览器中打开游戏时，支持游戏的操作。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Touch swipe merges tiles (Priority: P1)

A smartphone player opens the 1024 game in a mobile browser, performs a single-finger swipe gesture, and watches the tiles merge with score feedback tailored for the small screen.

**Why this priority**: Recognizing primary touch input is the minimum viable interaction for mobile players; without it the game cannot be played on phones.

**Independent Test**: Playwright mobile emulation `tests/playwright/mobile/touch-swipe.spec.ts` loads fixture `fixture-mobile-opening-001.json` with RNG seed `seed-mobile-alpha-251022`, injects a 180px left swipe, and verifies emitted engine events and HUD updates sized for a 360×640 viewport.

**Acceptance Scenarios**:

1. **Given** board state `fixture-mobile-opening-001` with RNG seed `seed-mobile-alpha-251022`, **When** the player swipes `Left`, **Then** tiles merge into `[[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,4,2,0]]` after spawn at index `15` and score changes by `8`.
2. **Given** telemetry is enabled, **When** the move completes, **Then** an event `mobile.move.completed` containing board hash `hash-mobile-alpha-001` and latency `<90ms` is emitted.

---

### User Story 2 - One-handed tap controls (Priority: P2)

A player holding the device in one hand taps on-screen directional buttons to progress the game without relying on swipe precision and still receives responsive feedback.

**Why this priority**: Alternate controls reduce frustration for users playing on crowded public transit or with limited mobility, improving accessibility and retention.

**Independent Test**: Playwright scenario `tests/playwright/mobile/tap-controls.spec.ts` loads fixture `fixture-mobile-midgame-002.json` with RNG seed `seed-mobile-beta-251022`, simulates tap inputs on the overlay controls, and asserts focus order plus animation pacing under 16ms frames.

**Acceptance Scenarios**:

1. **Given** board state `fixture-mobile-midgame-002` with RNG seed `seed-mobile-beta-251022`, **When** the player taps the `Up` control followed by `Right`, **Then** the resulting matrix is `[[0,0,8,4],[0,0,0,0],[0,0,0,0],[0,0,0,2]]`, score increases by `20`, and the move counter increments by `2`.
2. **Given** a player navigating with VoiceOver focus, **When** the directional buttons receive focus, **Then** each control announces its direction and activation hint without trapping focus within the overlay.

---

### User Story 3 - Orientation and resume continuity (Priority: P3)

A mobile browser user rotates the device between portrait and landscape, briefly backgrounds the tab, and returns to the game with layout, gestures, and state intact.

**Why this priority**: Orientation and session interruptions are common on mobile; preserving continuity prevents perceived bugs and drop-offs in session length.

**Independent Test**: Playwright scenario `tests/playwright/mobile/orientation-resume.spec.ts` loads fixture `fixture-mobile-resume-003.json` with RNG seed `seed-mobile-gamma-251022`, triggers viewport resize events (360×640 → 640×360), simulates a background/foreground cycle, and validates rendered board scaling and restored gesture listeners.

**Acceptance Scenarios**:

1. **Given** board state `fixture-mobile-resume-003` with RNG seed `seed-mobile-gamma-251022`, **When** the player rotates from portrait to landscape and back without performing a move, **Then** the board remains centered within the safe area, tiles scale proportionally, and no new tiles spawn.
2. **Given** the session is paused for 90 seconds while the tab is backgrounded, **When** the player returns, **Then** gesture handlers remain active, the move history is intact, and a passive toast confirms the resume time.

---

### Edge Cases

- Multi-touch detection ignores second-finger input during a swipe, preventing unintended diagonal moves.
- Short swipes under 40px translate to no-move feedback and haptic prompt instead of misfiring a direction.
- Orientation change mid-animation waits for the animation frame to finish before recalculating layout to avoid tile jitter.
- Virtual keyboard appearance while naming a score does not occlude the board; viewport height recalculates and scrolls controls into view.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The interaction layer MUST recognize single-finger swipes of ≥60px in any cardinal direction within 120ms and map them to existing engine move commands without mis-triggering on pinch or scroll gestures.
- **FR-002**: The UI MUST provide reachable on-screen directional controls with 44×44px minimum hit targets, operable via touch and accessibility focus, and reflecting active state within 50ms.
- **FR-003**: Layout rendering MUST scale the board, HUD, and controls to fit viewports from 320px to 768px width without horizontal scrolling and maintain ≥12px text legibility.
- **FR-004**: Session management MUST persist current board, score, RNG seed, and pending gesture queue during visibility changes up to 5 minutes to guarantee resume continuity.
- **FR-005**: Telemetry MUST include device category (`mobile`), gesture type, and move latency metrics for ≥95% of mobile interactions while respecting existing privacy preferences.
- **FR-006**: Orientation handling MUST recalculate board dimensions within one animation frame and debounce successive rotations to prevent duplicate renders or lost input listeners.
- **FR-007**: Accessibility feedback MUST announce move results, control activations, and resume status via localized ARIA live regions without duplicating announcements between touch and tap inputs.

### Key Entities *(include if feature involves data)*

- **TouchInputSession**: Captures gesture start/end coordinates, duration, and resolved direction used to dispatch engine moves and telemetry payloads.
- **ViewportLayoutProfile**: Defines breakpoint-specific tile sizes, HUD placement, and safe-area insets applied during orientation or viewport changes.
- **MobileInteractionLog**: Structured event record storing device category, interaction method (swipe or tap), latency metrics, and resume timestamps for analytics.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of swipe gestures on Chrome Android and Safari iOS register and dispatch a move within 120ms in Playwright traces.
- **SC-002**: The primary game board remains fully visible without horizontal scrolling on devices with viewport width ≥320px in responsive snapshot tests.
- **SC-003**: Accessibility audits (axe-core mobile ruleset plus screen-reader manual checks) report zero critical issues and at most one minor warning for mobile-specific controls.
- **SC-004**: Telemetry dashboards confirm ≥95% of mobile sessions log move latency, gesture type, and orientation status within 5 minutes of gameplay.
- **SC-005**: User feedback collected via in-app survey shows ≥4.3/5 satisfaction for mobile responsiveness and control clarity within the first beta cohort.

## Assumptions

- Targeted browsers include Chrome 128+, Safari 17+, and Firefox 129 mobile releases with pointer events enabled.
- Existing desktop engine behavior remains authoritative; mobile support adapts input and layout layers without modifying core game logic.
- Haptic feedback is available when supported by the device but gracefully falls back to visual cues where unavailable.
- Localization strings for new announcements can reuse the existing translation workflow without introducing additional locales.
