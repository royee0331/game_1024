# Tasks: Browser 1024 Puzzle

**Input**: Design documents from `/specs/001-browser-1024-game/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Acceptance tests are derived from spec.md scenarios (Vitest, Playwright, axe-core). Write them when called out below.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish pnpm workspace, toolchain, and base project layout.

- [x] T001 Initialize monorepo workspace metadata in `package.json` and `pnpm-workspace.yaml` at repo root to register `packages/*` and `frontend/`.
- [x] T002 Author shared TypeScript settings in `tsconfig.base.json` with strict mode and path aliases for `@core`, `@shared`, and `@ui-telemetry`.
- [x] T003 [P] Configure linting/formatting by adding `.eslintrc.cjs`, `.prettierrc`, and lint scripts in `package.json`.
- [x] T004 [P] Scaffold Vite + React 18 application in `frontend/` with Storybook and Playwright harness entries in `frontend/package.json`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story work.

- [x] T005 Define immutable domain types (`Tile`, `GameState`, `EngineEvent`, `TelemetryPayload`) in `packages/core/src/types.ts` per data-model.md.
- [x] T006 [P] Implement seeded PRNG provider and cursor tracker in `packages/core/src/random/prng.ts` with deterministic transcript logging.
- [x] T007 [P] Setup Vitest config and initial engine spec harness in `packages/core/vitest.config.ts` and `packages/core/tests/engine.setup.ts`.
- [x] T008 Establish LocalStorage persistence adapter with in-memory fallback in `packages/shared/src/storage/localSession.ts`.
- [x] T009 [P] Create telemetry batching queue using `navigator.sendBeacon` in `packages/ui-telemetry/src/beaconQueue.ts`.
- [x] T010 Seed deterministic fixture JSONs (`fixture-start-001.json`, etc.) in `tests/fixtures/` and expose helper loader in `tests/unit/fixtures.ts`.

**Checkpoint**: Foundation ready – user story implementation can now begin.

---

## Phase 3: User Story 1 - Keyboard merge and spawn (Priority: P1) 🎯 MVP

**Goal**: Desktop player merges tiles via keyboard input, sees resulting spawn, score update, and telemetry event.

**Independent Test**: Playwright `frontend/tests/interaction/keyboard-move.spec.ts` using `fixture-start-001.json` reproduces matrix/score and emits `move.completed` telemetry under 80ms.

### Tests for User Story 1

- [x] T011 [P] [US1] Write Vitest move resolution spec in `tests/unit/engine/keyboard-left.spec.ts` asserting deterministic board + score output for `fixture-start-001`.
- [x] T012 [P] [US1] Implement Playwright scenario `frontend/tests/interaction/keyboard-move.spec.ts` covering left-arrow merge and latency assertion.

### Implementation for User Story 1

- [x] T013 [US1] Implement deterministic move pipeline in `packages/core/src/engine/applyMove.ts` to slide, merge once per tile, and spawn via RNG cursor.
- [x] T014 [US1] Add board hash + score formatting helpers in `packages/shared/src/formatters/boardHash.ts` for telemetry payloads.
- [x] T015 [US1] Create session controller store in `frontend/src/state/sessionStore.ts` using Zustand to bridge engine results and persistence.
- [x] T016 [US1] Build keyboard input hook in `frontend/src/hooks/useKeyboardInput.ts` supporting arrows + WASD with animation gating.
- [x] T017 [US1] Render tile grid and merge animations in `frontend/src/components/TileGrid.tsx` using framer-motion springs.
- [x] T018 [US1] Queue and flush telemetry events on move completion in `frontend/src/hooks/useTelemetryQueue.ts` leveraging `packages/ui-telemetry`.

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Touch swipe progression (Priority: P2)

**Goal**: Mobile user performs sequential swipes, with state persistence, move counter, and best score updates.

**Independent Test**: Playwright mobile emulation `frontend/tests/interaction/touch-swipe.spec.ts` executing Up → Right ensures board continuity, score delta 28, and HUD updates.

### Tests for User Story 2

- [x] T019 [P] [US2] Add Playwright mobile swipe spec in `frontend/tests/interaction/touch-swipe.spec.ts` with RNG seed `seed-beta-221022`.
- [x] T020 [P] [US2] Create Vitest engine replay spec `tests/unit/engine/swipe-sequence.spec.ts` validating deterministic results for Up → Right sequence.

### Implementation for User Story 2

- [x] T021 [US2] Implement pointer-based swipe detection hook in `frontend/src/hooks/useSwipeInput.ts` with debounce + direction thresholds.
- [x] T022 [US2] Extend Zustand session store in `frontend/src/state/sessionStore.ts` to track move counter and persist current state to LocalStorage.
- [x] T023 [US2] Update HUD component in `frontend/src/components/Hud.tsx` to display score, best score, and move count with immediate best score promotion.
- [x] T024 [US2] Serialize undo history + RNG cursor in `packages/shared/src/storage/localSession.ts` for reload continuity.
- [x] T025 [US2] Ensure RNG adapter exposes deterministic cursor advance API in `packages/core/src/random/index.ts` for multi-move sessions.

**Checkpoint**: User Stories 1 and 2 operate independently with persisted progress.

---

## Phase 5: User Story 3 - Game over and restart accessibility (Priority: P3)

**Goal**: Screen-reader user hears game-over announcement, focus shifts to restart control, and restart preserves best score.

**Independent Test**: Vitest accessibility audit `frontend/tests/accessibility/game-over.a11y.spec.ts` plus Playwright `frontend/tests/interaction/game-over-restart.spec.ts` verifying ARIA live output and focus order.

### Tests for User Story 3

- [x] T026 [P] [US3] Create axe-core accessibility spec in `frontend/tests/accessibility/game-over.a11y.spec.ts` covering live region output.
- [x] T027 [P] [US3] Author Playwright scenario `frontend/tests/interaction/game-over-restart.spec.ts` validating focus and restart flow.

### Implementation for User Story 3

- [x] T028 [US3] Add game-over detection helper in `packages/core/src/engine/detectGameOver.ts` and emit `GameOver` event when no moves remain.
- [x] T029 [US3] Introduce `GameAnnouncements` live region in `frontend/src/components/GameAnnouncements.tsx` announcing localized status strings.
- [x] T030 [US3] Implement accessible restart control in `frontend/src/components/RestartButton.tsx` handling Enter/Space activation and focus management.
- [x] T031 [US3] Enrich telemetry queue in `frontend/src/hooks/useTelemetryQueue.ts` to include `GameOver` payload with board hash and latency.

**Checkpoint**: All user stories satisfy acceptance criteria and can be demonstrated independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, performance, and documentation after core stories complete.

- [x] T032 Profile animation timing and expose metrics hook in `frontend/src/hooks/usePerformanceMetrics.ts` to ensure <80ms latency.
- [x] T033 [P] Document telemetry schema and sendBeacon fallback behavior in `packages/ui-telemetry/README.md`.
- [x] T034 Run end-to-end validation from `specs/001-browser-1024-game/quickstart.md` ensuring fixtures launch and telemetry mock receives batches.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → prerequisite for all subsequent work.
- **Foundational (Phase 2)** → depends on Setup; blocks User Stories 1–3.
- **User Story Phases (3–5)** → depend on Foundational; execute in priority order (US1 → US2 → US3) but can run in parallel once shared files are isolated.
- **Polish (Phase 6)** → depends on completion of targeted user stories.

### User Story Dependencies

- **US1**: Requires Foundational assets only.
- **US2**: Depends on US1 telemetry/session plumbing being merged; otherwise independent.
- **US3**: Builds on US1 engine events and US2 persistence to announce and restart correctly.

### Parallel Opportunities

- Setup tasks T003 and T004 can run alongside T002 after workspace files exist.
- Foundational tasks T006, T007, T009 operate on distinct modules and may proceed in parallel.
- Within US1, T011 and T012 (tests) run concurrently; T016 and T017 touch separate files once engine logic is stable.
- Different user stories can be staffed concurrently after their dependencies are satisfied.

---

## Implementation Strategy

### MVP First (Deliver User Story 1)
1. Complete Phase 1 and Phase 2.
2. Implement and verify User Story 1 tasks (T011–T018).
3. Demo keyboard merge flow with telemetry before proceeding.

### Incremental Delivery
1. Ship MVP (US1) with deterministic engine + telemetry.
2. Layer in US2 touch/persistence enhancements (T019–T025).
3. Finalize accessibility + restart features from US3 (T026–T031).
4. Conclude with polish items (T032–T034).

### Parallel Team Strategy
- Developer A: Focus on engine + telemetry (Foundational, US1 tasks touching `packages/core` and `packages/ui-telemetry`).
- Developer B: Own frontend interaction layers (US1–US2 hooks/components under `frontend/src`).
- Developer C: Handle accessibility + polish (US3 components, performance instrumentation).

---

## Report

- **tasks.md Path**: `/workspace/game_1024/specs/001-browser-1024-game/tasks.md`
- **Total Tasks**: 34
- **Task Count by User Story**: US1 → 8 tasks, US2 → 7 tasks, US3 → 6 tasks (remaining 13 tasks are setup/foundational/polish).
- **Parallel Opportunities**: Setup (T003, T004), Foundational (T006, T007, T009), Tests per story (T011–T012, T019–T020, T026–T027), Polish doc task T033.
- **Independent Test Criteria**:
  - US1: Playwright keyboard scenario + Vitest move spec.
  - US2: Playwright mobile swipe scenario + Vitest sequential move spec.
  - US3: axe-core accessibility spec + Playwright restart scenario.
- **Suggested MVP Scope**: Complete through Phase 3 (US1) before shipping.
- **Format Validation**: All tasks follow `- [ ] T### [P] [US#] Description with file path` checklist format.
