# Feature Specification: Mobile Scoreboard Layout & Completion Prompt

**Feature Branch**: `003-mobile-score-ui`
**Created**: 2025-10-22
**Status**: Draft
**Input**: User description: "帮我优化交互页面，1. 手机浏览器打开游戏页面，计分页面布局不够美观，帮我优化页面局. 2.游戏结束时应弹出提示框，提示挑战完成，或者游戏结束，然后点击重新开始继续游戏"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mobile HUD readability (Priority: P1)

A smartphone player launches the 1024 game in a mobile browser and needs the score, best score, and move count to display in a single-column HUD that is legible and evenly spaced above the board.

**Why this priority**: Without a readable HUD, players cannot quickly understand their progress, making the mobile experience feel unfinished even if core gameplay works.

**Independent Test**: Playwright mobile scenario `tests/playwright/mobile/hud-layout.spec.ts` loads fixture `fixture-mobile-hud-compact-001.json` with RNG seed `seed-hud-compact-251022`, emulates a 360×640 viewport, and captures layout snapshots alongside axe-core assertions.

**Acceptance Scenarios**:

1. **Given** board state `fixture-mobile-hud-compact-001` with RNG seed `seed-hud-compact-251022`, **When** the viewport loads the HUD on a 360×640 display, **Then** the Score, Best, and Moves cards render stacked in two rows with ≥16px vertical spacing, centered text, and each value fits within the safe area without wrapping.
2. **Given** the same viewport and board state, **When** the player swipes `Up`, **Then** the HUD updates to show Score `4`, Best `2304`, Moves `1`, and axe-core verifies accessible labels "当前得分", "最佳成绩", and "步数" remain associated with their values.

---

### User Story 2 - Game completion prompt (Priority: P2)

A mobile player reaches a terminal board state and expects a modal prompt announcing the challenge completion with their final score and a clear restart action.

**Why this priority**: A prompt communicates success and next steps, preventing confusion when no moves remain and encouraging replay.

**Independent Test**: Playwright scenario `tests/playwright/mobile/gameover-prompt.spec.ts` loads `fixture-mobile-gameover-001.json` with RNG seed `seed-gameover-251022`, performs the last valid move, and verifies modal content, focus management, and restart CTA visibility.

**Acceptance Scenarios**:

1. **Given** board state `fixture-mobile-gameover-001` with RNG seed `seed-gameover-251022`, **When** the player swipes `Down` to trigger the final merge, **Then** a modal overlay appears within 400ms showing the localized title "挑战完成", final score `4096`, best score `4096`, move count `76`, and buttons labeled "重新开始" and "继续挑战".
2. **Given** the modal is open, **When** a screen reader user tabs forward, **Then** initial focus lands on "重新开始", aria-describedby references the score summary, and pressing `Escape` closes the modal without resuming the game.

---

### User Story 3 - Instant restart flow (Priority: P3)

After acknowledging the prompt, the player restarts the session and expects the board, score, and move counter to reset while preserving the recorded best score.

**Why this priority**: A frictionless restart keeps players engaged and ensures repeat sessions without manual page refresh.

**Independent Test**: Playwright scenario `tests/playwright/mobile/gameover-restart.spec.ts` uses `fixture-mobile-gameover-001.json` with RNG seed `seed-gameover-251022`, activates the restart button, and confirms a new seeded board plus telemetry reset hooks.

**Acceptance Scenarios**:

1. **Given** the game over modal displays final score `4096`, **When** the player activates "重新开始", **Then** the board reinitializes to `[[0,0,0,0],[0,0,0,0],[0,2,0,0],[0,0,2,0]]`, the score resets to `0`, moves reset to `0`, and the best score remains `4096`.
2. **Given** a restart occurred within 1 second of modal display, **When** telemetry listeners emit `session.restart`, **Then** the HUD reflects the new session ID and the modal is dismissed without leaving focus traps.

---

### Edge Cases

- Numbers ≥6 digits (e.g., scores above 100000) must not overflow the HUD cards or clip inside the safe area on 320px-wide devices.
- Locale strings up to 20 characters per label (e.g., "最佳成绩（历史最高）") must fit without forcing the board off-screen.
- Consecutive game overs triggered within 3 moves should not stack multiple modals; the prompt must reuse a single overlay instance.
- Restarting immediately after rotating from portrait to landscape must recalculate safe-area padding before the new board renders to avoid HUD overlap.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The mobile HUD MUST collapse Score, Best, and Moves into a two-row layout for viewports ≤480px wide, preserving ≥16px vertical spacing and ≥12px lateral padding while keeping text center-aligned.
- **FR-002**: Score, Best, and Moves labels MUST include localized aria-label or aria-labelledby attributes that remain associated with their numeric values after each engine update.
- **FR-003**: The game over detector MUST trigger a modal overlay within 400ms of the final move, displaying localized title copy, final metrics, and two actions: primary restart and secondary dismiss/continue browsing.
- **FR-004**: While the modal is open, focus MUST be trapped inside the overlay, the primary button receives initial focus, and pressing Escape or tapping the scrim MUST close the prompt without executing a move.
- **FR-005**: Activating the restart button MUST create a new session seeded via the default RNG, reset score and moves to zero, preserve stored best score, and emit a `session.restart` telemetry event before user input resumes.
- **FR-006**: Safe-area insets reported by mobile browsers MUST be applied to both the HUD and modal positioning so that content never sits underneath system UI cutouts.

### Key Entities *(include if feature involves data)*

- **ScoreHudViewModel**: Combines live score, best score, move count, and localized labels into a render-ready structure that tracks layout variant (stacked vs. wide).
- **GameEndPromptState**: Stores final metrics, visibility flag, focus target, and callbacks for restart or dismiss actions, ensuring a single modal instance is reused per session.
- **SessionTelemetryEnvelope**: Records session ID, restart timestamp, trigger source (`gameover-modal`), and previous best score for analytics dashboards.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Visual regression baselines confirm 100% of 320–480px wide snapshots keep HUD cards fully visible with ≥12px margin to screen edges and no text wrapping.
- **SC-002**: 95% of game over events in automated mobile gameplay runs display the completion modal within 400ms of the triggering move.
- **SC-003**: Accessibility audits covering mobile heuristics report zero critical issues and validate focus order on first attempt across current Chrome Android and Safari iOS releases.
- **SC-004**: Telemetry aggregation shows ≥98% of restart actions emit the `session.restart` event with new session IDs and preserved best score within 300ms of button activation.

## Assumptions

- Existing desktop layout continues to use the current HUD arrangement; responsive breakpoints determine when the stacked layout applies.
- Localized copy for modal buttons and titles is available through the current translation pipeline and may reuse existing "重新开始" strings.
- Playwright mobile fixtures can reuse deterministic RNG seeds already stored in `/tests/fixtures/mobile/` without introducing new engine logic.
- Telemetry infrastructure already captures session IDs and can append restart metadata without schema changes.
