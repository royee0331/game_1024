# Feature Specification: Browser 1024 Puzzle

**Feature Branch**: `001-browser-1024-game`
**Created**: 2025-10-22
**Status**: Draft
**Input**: User description: "设计一个浏览器运行的1024游戏，1024游戏（也叫 2048的原版或前身）是一种非常经典的数字合并类益智游戏。玩法简单但很容易上瘾。下面是它的基本规则介绍：\n\n🎮 游戏规则：\n\t1.\t棋盘：通常是一个 4×4 的方格。\n\t2.\t操作：玩家可以用 上、下、左、右 键滑动所有方块。\n\t3.\t合并：当两个相同数字的方块碰到一起时，它们会合并成一个更大的数字（例如 2 + 2 = 4, 4 + 4 = 8）。\n\t4.\t目标：\n\t•\t在 1024版 中，目标是合并出 1024 这个数字。\n\t•\t后来流行的 2048版 目标则是合成 2048。\n\t5.\t失败条件：棋盘被填满且无法再进行合并时，游戏结束。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keyboard merge and spawn (Priority: P1)

A desktop player starts a new session, uses arrow keys to merge the first tiles, and sees the resulting spawn and score update.

**Why this priority**: Keyboard play is the primary control scheme for desktop browsers and must feel deterministic and responsive for the core gameplay loop.

**Independent Test**: Playwright scenario `specs/ui/keyboard-move.spec.ts` loads fixture `fixture-start-001.json` with RNG seed `seed-alpha-221022`, sends a left-arrow key event, and asserts engine events plus DOM updates.

**Acceptance Scenarios**:

1. **Given** board state `fixture-start-001` with RNG seed `seed-alpha-221022`, **When** the player swipes `Left`, **Then** tiles merge into `[[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,0,0,0]]` and score changes by `4`.
2. **Given** telemetry is enabled, **When** the move completes, **Then** an event `move.completed` containing board hash `hash-seed-alpha-001` and latency `<80ms` is emitted.

---

### User Story 2 - Touch swipe progression (Priority: P2)

A mobile browser user swipes through multiple moves, continuing the game state across turns while viewing running score and best score.

**Why this priority**: Touch controls unlock the largest audience segment on phones and tablets and demonstrate persistence of state across sequential swipes.

**Independent Test**: Playwright mobile emulation `specs/ui/touch-swipe.spec.ts` loads fixture `fixture-midgame-002.json` with RNG seed `seed-beta-221022`, simulates swipe Up then Right gestures, and verifies state continuity and HUD updates.

**Acceptance Scenarios**:

1. **Given** board state `fixture-midgame-002` with RNG seed `seed-beta-221022`, **When** the player swipes `Up` then `Right`, **Then** the resulting matrix is `[[0,0,4,8],[0,0,0,0],[0,0,0,0],[0,0,0,0]]`, score increases by `28`, and move counter increments by `2`.
2. **Given** best score storage exists, **When** the cumulative score exceeds the stored best, **Then** the HUD best score updates immediately without reloading the page.

---

### User Story 3 - Game over and restart accessibility (Priority: P3)

A screen-reader user reaches a game-over state, hears the announcement, and restarts via accessible controls with state reset and retained high score.

**Why this priority**: Accessibility compliance is essential for inclusive design and ensures that loss and restart flows are perceivable and operable without vision.

**Independent Test**: Vitest accessibility audit `specs/accessibility/game-over.a11y.spec.ts` uses fixture `fixture-endgame-003.json` with RNG seed `seed-gamma-221022`, triggers a no-move state, and inspects ARIA live region output plus restart control focus order.

**Acceptance Scenarios**:

1. **Given** board state `fixture-endgame-003` with RNG seed `seed-gamma-221022`, **When** the player attempts any swipe, **Then** a `gameOver` event fires, an ARIA live message announces "无可用移动，按回车重新开始", and the restart button receives focus.
2. **Given** the user activates the restart control via Enter key, **When** the new session begins, **Then** the board resets to the seeded opening matrix with score `0` while best score persists.

---

### Edge Cases

- Double merges in a single row when three identical tiles align after a vertical move, ensuring only adjacent pairs combine once per move.
- Spawn blocking when the board has one empty cell and RNG selects an occupied index, verifying fallback to the remaining slot.
- Undo buffer integrity after rapid alternating swipes (Left/Right) while animations are mid-flight.
- High-contrast theme toggles preserving tile legibility for values above 512 and ensuring focus indicators remain visible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game engine MUST process a 4×4 grid, applying a single directional input to slide tiles, merge equal values once per move, and output the updated matrix, score delta, and emitted events without mutating inputs.
- **FR-002**: After each valid move, the engine MUST spawn a new tile valued `2` with 90% probability or `4` with 10% probability using the deterministic RNG seed provided by the session controller.
- **FR-003**: The input layer MUST support keyboard arrows, WASD, and swipe gestures with <50ms input capture latency on modern browsers (Chrome, Safari, Firefox, Edge).
- **FR-004**: The UI MUST animate tile movement and merges at 60fps-friendly timings (<=200ms transition) and block additional inputs until the animation cycle completes.
- **FR-005**: The session controller MUST persist current score, best score, RNG seed, and move history in local storage to allow reload continuity and optional undo of the last move.
- **FR-006**: The system MUST detect game-over states when no merges or slides are possible and present restart controls that reset the board while retaining best score.
- **FR-007**: Telemetry MUST capture move duration, direction, score delta, and resulting board hash for at least 95% of moves, batching events for network efficiency.
- **FR-008**: Accessibility features MUST include ARIA labels for tiles, a live region for game status updates, focusable controls, and a high-contrast mode toggle meeting WCAG 2.1 AA.

### Key Entities

- **GameState**: Immutable object containing tile matrix, current score, best score, move count, and RNG cursor.
- **EngineEvent**: Enumeration of outputs (`TileMoved`, `TileMerged`, `TileSpawned`, `MoveRejected`, `GameOver`) emitted per input for UI and telemetry consumption.
- **SessionSnapshot**: Persisted record of `GameState` plus undo history stored in local storage for reload and undo operations.
- **TelemetryPayload**: Structured data capturing move metadata, board hash, timing metrics, and client platform identifiers.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of measured moves complete with under 80ms from input receipt to animation start in Playwright performance traces.
- **SC-002**: Deterministic replays using published fixtures reproduce identical board states and scores across Chrome, Safari, and Firefox in CI runs.
- **SC-003**: Accessibility audits with axe-core and manual screen-reader testing report zero critical issues and at most two minor warnings.
- **SC-004**: Telemetry dashboards confirm at least 95% coverage of move events with valid board hashes and latency metrics per daily session sample.
- **SC-005**: User satisfaction surveys embedded in the help modal achieve an average rating of ≥4.2/5 for responsiveness and clarity after beta release.

## Assumptions

- The RNG seed strings follow the pattern `seed-[name]-[YYMMDD]` and are stored alongside move history for reproducibility.
- Local storage is available; for browsers where it fails, the game will fall back to in-memory session data without persistence.
- Network connectivity is not required for core gameplay; telemetry queues may flush when connectivity resumes without blocking play.
