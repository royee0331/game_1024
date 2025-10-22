# Tasks: Mobile Scoreboard Layout & Completion Prompt

**Input**: Design documents from `/specs/003-mobile-score-ui/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Seed deterministic fixtures required across all mobile HUD and modal scenarios.

- [ ] T001 Create `tests/fixtures/fixture-mobile-hud-compact-001.json` with the stacked HUD starting board and metadata from the spec.
- [ ] T002 Create `tests/fixtures/fixture-mobile-gameover-001.json` capturing the terminal board, scores, and move count referenced by modal tests.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Register fixtures and shared helpers that every user story relies on.

- [ ] T003 Update `frontend/src/fixtures/index.ts` to register `fixture-mobile-hud-compact-001` and `fixture-mobile-gameover-001` with the specified RNG seeds.
- [ ] T004 Extend `frontend/tests/interaction/mobile/testHarness.ts` to expose helpers for loading the new fixtures and viewport presets.

**Checkpoint**: Fixture plumbing ready—user stories can now execute their Playwright scenarios.

---

## Phase 3: User Story 1 - Mobile HUD readability (Priority: P1) 🎯 MVP

**Goal**: Present the score, best score, and move count in a stacked, legible HUD on mobile viewports with accessible labels.

**Independent Test**: Playwright mobile run `frontend/tests/interaction/mobile/hud-layout.spec.ts` renders `fixture-mobile-hud-compact-001` at 360×640, verifies stacked metrics spacing, and confirms aria associations.

### Tests for User Story 1 ⚠️

- [ ] T005 [P] [US1] Add Playwright spec `frontend/tests/interaction/mobile/hud-layout.spec.ts` validating stacked layout, spacing, and aria labels.
- [ ] T006 [P] [US1] Capture new visual baseline `frontend/tests/visual/hud-mobile.baseline.json` for the stacked HUD snapshot.

### Implementation for User Story 1

- [ ] T007 [US1] Refactor `frontend/src/components/Hud.tsx` to generate label `id`s, expose localized metric names, and switch between `stacked`/`wide` layout variants.
- [ ] T008 [US1] Update `frontend/src/scenes/GameScene.tsx` header markup to accommodate the single-column HUD above the title on small viewports.
- [ ] T009 [US1] Apply responsive HUD styles in `frontend/src/styles/global.css` and safe-area padding adjustments in `frontend/src/styles/mobile.css` to enforce ≥16px spacing and centered text.

**Checkpoint**: HUD renders clearly on mobile with accessible labels while desktop layout remains unchanged.

---

## Phase 4: User Story 2 - Game completion prompt (Priority: P2)

**Goal**: Display a modal announcing challenge completion with final metrics, localized copy, and focus trapping when no moves remain.

**Independent Test**: Playwright run `frontend/tests/interaction/mobile/gameover-prompt.spec.ts` triggers the final move on `fixture-mobile-gameover-001`, asserts modal copy within 400ms, and verifies focus trap behavior.

### Tests for User Story 2 ⚠️

- [ ] T010 [P] [US2] Author Playwright spec `frontend/tests/interaction/mobile/gameover-prompt.spec.ts` covering modal timing, messaging, and keyboard navigation.

### Implementation for User Story 2

- [ ] T011 [US2] Implement `frontend/src/components/GameOverModal.tsx` with final metrics, localized text, and manual focus trap sentinels.
- [ ] T012 [US2] Wire the modal into `frontend/src/scenes/GameScene.tsx`, gating `GameAnnouncements` output when the modal is visible.
- [ ] T013 [US2] Adjust `frontend/src/components/GameAnnouncements.tsx` to hand off end-of-game messaging to the modal without duplicate prompts.
- [ ] T014 [US2] Add modal overlay styling, safe-area spacing, and backdrop blur rules in `frontend/src/styles/global.css` and `frontend/src/styles/mobile.css`.

**Checkpoint**: Game over state surfaces a modal with actionable controls and compliant focus management.

---

## Phase 5: User Story 3 - Instant restart flow (Priority: P3)

**Goal**: Restart from the modal without losing best score, emit `session.restart` telemetry, and reset the board immediately.

**Independent Test**: Playwright run `frontend/tests/interaction/mobile/gameover-restart.spec.ts` clicks the modal restart button, validates new seed board, preserved best score, and captured telemetry payload.

### Tests for User Story 3 ⚠️

- [ ] T015 [P] [US3] Implement Playwright spec `frontend/tests/interaction/mobile/gameover-restart.spec.ts` asserting board reset, focus release, and telemetry capture.
- [ ] T016 [P] [US3] Update existing desktop regression `frontend/tests/interaction/game-over-restart.spec.ts` to account for modal-driven restart flow and telemetry assertions.

### Implementation for User Story 3

- [ ] T017 [US3] Enhance `frontend/src/state/sessionStore.ts` restart logic to emit the `session.restart` telemetry envelope before seeding a new session.
- [ ] T018 [US3] Extract a shared `useSessionRestart` helper in `frontend/src/state/sessionStore.ts` (or adjacent hook) reused by the modal and `RestartButton`.
- [ ] T019 [US3] Refactor `frontend/src/components/RestartButton.tsx` to leverage the shared restart helper and remain accessible when the modal is dismissed.

**Checkpoint**: Restarting from either entry point rebuilds the board instantly, records telemetry, and preserves best score.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements, documentation, and regression sweeps.

- [ ] T020 [P] Add modal and HUD entries to `frontend/stories` (or update existing Storybook docs) for manual QA references.
- [ ] T021 Run `pnpm lint`, `pnpm test`, and `pnpm --filter frontend test:e2e:mobile` to confirm no regressions.
- [ ] T022 Update `README.md` or release notes (if applicable) summarizing the mobile HUD and modal improvements.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → must complete before Foundational tasks to guarantee fixture assets exist.
- **Foundational (Phase 2)** → depends on Setup, unlocks all user stories by wiring fixtures into the app.
- **User Story Phases (3–5)** → each depends on Foundational completion; execute in priority order (US1 → US2 → US3) for MVP-first delivery.
- **Polish (Phase 6)** → runs after desired user stories finish.

### User Story Dependencies

- **US1**: Independent once fixtures are registered.
- **US2**: Independent but benefits from HUD layout to ensure modal spacing aligns with header changes.
- **US3**: Depends on modal infrastructure from US2 to access restart entry point.

### Parallel Opportunities

- Tasks marked `[P]` within each phase can run concurrently (e.g., writing Playwright specs while another engineer updates components).
- US1 test tasks (T005–T006) may proceed in parallel once fixtures are ready.
- US2 modal styling (T014) can progress alongside modal component development after T011 outlines markup.
- US3 telemetry updates (T017) can happen while T015 prepares interaction specs.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phases 1 and 2 to seed fixtures and harness helpers.
2. Deliver Phase 3 (US1) to achieve a mobile-friendly HUD that meets accessibility goals.
3. Validate with Playwright and visual baselines before expanding scope.

### Incremental Delivery
1. Ship US1 (stacked HUD) as MVP.
2. Add US2 (completion modal) for clear session closure.
3. Finish with US3 (restart telemetry) to round out analytics and replay flow.

### Parallel Team Strategy
- Developer A tackles HUD implementation (Phase 3) while Developer B prepares modal component (Phase 4) once foundational wiring is done.
- Developer C focuses on telemetry and restart flow (Phase 5) in coordination with modal integration tasks.

---

## Summary Report

- **tasks.md path**: `/workspace/game_1024/specs/003-mobile-score-ui/tasks.md`
- **Total tasks**: 22
- **Tasks per user story**:
  - US1: 5 tasks
  - US2: 5 tasks
  - US3: 5 tasks
- **Parallel opportunities**: Marked on tasks T005, T006, T010, T015, T016, T020 where work can proceed concurrently.
- **Independent test criteria**:
  - US1: Playwright HUD layout spec with fixture `fixture-mobile-hud-compact-001`.
  - US2: Playwright modal timing spec on `fixture-mobile-gameover-001`.
  - US3: Playwright restart spec verifying board reset and telemetry payload.
- **Suggested MVP scope**: Complete through Phase 3 (User Story 1) to deliver a visibly improved mobile HUD before layering modal and telemetry work.
- **Format validation**: All tasks follow `- [ ] T### [P?] [US?] Description with file path` format.
