# Tasks: Mobile Browser Play Support

**Input**: Design documents from `/specs/002-support-mobile-play/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Each user story includes targeted Playwright and Vitest coverage to keep scenarios independently verifiable.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each slice.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Seed deterministic fixtures and runner hooks that every mobile scenario depends on.

- [ ] T001 Extend mobile fixtures `fixture-mobile-opening-001`, `fixture-mobile-midgame-002`, `fixture-mobile-resume-003` in `frontend/src/fixtures/index.ts`.
- [ ] T002 Register a `mobile` project with 360×640 and 640×360 viewports in `frontend/playwright.config.ts` for reuse by new specs.
- [ ] T003 Add a `test:e2e:mobile` script alias in `frontend/package.json` targeting `playwright test --grep "mobile"` to simplify quickstart steps.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared telemetry and test harness updates required before any story work begins.

- [ ] T004 Update `packages/core/src/types.ts` and `packages/ui-telemetry/src/beaconQueue.ts` to accept `deviceCategory`, `gestureType`, `orientation`, and `latencyMs` fields defined in `contracts/mobile-move-event.openapi.yaml`.
- [ ] T005 [P] Create `frontend/tests/interaction/mobile/testHarness.ts` with helpers for loading fixtures, capturing telemetry, and dispatching pointer/tap gestures.
- [ ] T006 [P] Define `MobileInteractionLog` interfaces mirroring the contract in `packages/ui-telemetry/src/mobilePayload.ts` and re-export from `packages/ui-telemetry/src/index.ts`.

---

## Phase 3: User Story 1 - Touch swipe merges tiles (Priority: P1) 🎯 MVP

**Goal**: Let a mobile browser player trigger a left swipe with one finger, observe deterministic merges, and emit enriched telemetry with latency feedback.

**Independent Test**: Playwright mobile run on `fixture-mobile-opening-001` with seed `seed-mobile-alpha-251022` verifies the final board `[[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,4,2,0]]`, score delta `8`, telemetry payload fields, and latency toast.

### Tests for User Story 1

- [ ] T007 [P] [US1] Add `frontend/tests/interaction/mobile/swipe.spec.ts` covering the left-swipe scenario with telemetry assertions.
- [ ] T008 [P] [US1] Write `frontend/src/hooks/__tests__/useSwipeInput.test.ts` ensuring the 60px threshold, multi-touch suppression, and latency capture behave as expected.
- [ ] T009 [P] [US1] Create `packages/ui-telemetry/tests/mobileTelemetry.test.ts` validating serialization of the mobile move payload including gesture metadata.

### Implementation for User Story 1

- [ ] T010 [US1] Refactor `frontend/src/hooks/useSwipeInput.ts` to use the new `TouchInputSession`, pointer/touch fallbacks, and haptic/no-move feedback for sub-40px gestures.
- [ ] T011 [US1] Update `frontend/src/state/sessionStore.ts` to timestamp gestures, compute `MobileInteractionLog`, enqueue telemetry with `deviceCategory: 'mobile'`, and block duplicate swipes during animations.
- [ ] T012 [US1] Extend `frontend/src/hooks/useTelemetryQueue.ts` to flush mobile move events immediately after completion and surface latency metrics for announcements.
- [ ] T013 [US1] Enhance `frontend/src/components/GameAnnouncements.tsx` to announce touch move completions, latency messages, and no-move prompts in Mandarin.

**Checkpoint**: User Story 1 playable via touch swipe with deterministic merges and telemetry.

---

## Phase 4: User Story 2 - One-handed tap controls (Priority: P2)

**Goal**: Provide accessible on-screen directional buttons operable with one hand or assistive technologies, updating telemetry to record tap gestures.

**Independent Test**: Playwright mobile run on `fixture-mobile-midgame-002` triggers Up then Right taps, asserts resulting matrix `[[0,0,8,4],[0,0,0,0],[0,0,0,0],[0,0,0,2]]`, VoiceOver labels, and telemetry `gestureType: 'tap'`.

### Tests for User Story 2

- [ ] T014 [P] [US2] Create `frontend/tests/interaction/mobile/tap-controls.spec.ts` validating tap-to-move flow and HUD updates.
- [ ] T015 [P] [US2] Add `frontend/tests/accessibility/mobile-controls.a11y.spec.ts` to audit ARIA labels and focus order for the overlay buttons.

### Implementation for User Story 2

- [ ] T016 [US2] Build `frontend/src/components/MobileControls.tsx` with four 44×44px buttons, aria labels, and haptic hooks for single-handed play.
- [ ] T017 [US2] Integrate `MobileControls` into `frontend/src/scenes/GameScene.tsx`, including a HUD toggle and focus management for assistive users.
- [ ] T018 [US2] Introduce responsive styles in `frontend/src/styles/mobile.css` so controls anchor to the safe area bottom in portrait and side in landscape.
- [ ] T019 [US2] Extend `frontend/src/state/sessionStore.ts` to enqueue tap-driven `MoveCommand`s with `gestureType: 'tap'` and maintain telemetry parity with swipes.
- [ ] T020 [US2] Publish `frontend/stories/MobileControls.stories.tsx` showcasing portrait and landscape layouts with Storybook viewport controls.

**Checkpoint**: Mobile controls usable with taps, accessible, and recorded in telemetry independently of swipes.

---

## Phase 5: User Story 3 - Orientation and resume continuity (Priority: P3)

**Goal**: Keep gameplay responsive through device rotations and tab backgrounding, persisting state and announcing resume context without spawning unintended tiles.

**Independent Test**: Playwright mobile run on `fixture-mobile-resume-003` rotates portrait↔landscape and backgrounds the tab for 90 seconds, verifying layout centering, gesture handlers still active, telemetry orientation updates, and resume toast copy.

### Tests for User Story 3

- [ ] T021 [P] [US3] Implement `frontend/tests/interaction/mobile/orientation-resume.spec.ts` validating rotation layout and resume toast behavior.
- [ ] T022 [P] [US3] Add `packages/shared/tests/localSession.mobileResume.test.ts` covering persistence of gesture queues, `lastVisibleAt`, and orientation metadata.

### Implementation for User Story 3

- [ ] T023 [US3] Create `frontend/src/hooks/useMobileViewport.ts` capturing orientation, safe-area insets, and debounced resize events for consumers.
- [ ] T024 [US3] Update `frontend/src/styles/mobile.css` and `frontend/src/components/TileGrid.tsx` to honor `ViewportLayoutProfile` sizing during orientation changes.
- [ ] T025 [US3] Extend `packages/shared/src/storage/localSession.ts` to persist `ResumeSnapshot` fields (`gestureQueue`, `lastVisibleAt`, `orientation`).
- [ ] T026 [US3] Wire `frontend/src/state/sessionStore.ts` to listen for `visibilitychange`, hydrate resume snapshots, and emit resume telemetry timestamps.
- [ ] T027 [US3] Enhance `frontend/src/components/GameAnnouncements.tsx` to queue and expire resume toasts without duplicating high-priority messages.

**Checkpoint**: Orientation changes and background resumes leave gameplay intact with accurate messaging and telemetry.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize documentation, visual coverage, and cross-story verifications.

- [ ] T028 [P] Document mobile quickstart instructions and telemetry fields in `specs/002-support-mobile-play/quickstart.md` and `packages/ui-telemetry/README.md`.
- [ ] T029 Consolidate Storybook responsive snapshots and update `frontend/tests/visual/` baselines for mobile layouts.
- [ ] T030 Verify quickstart flow by running `pnpm test:e2e:mobile` and `pnpm --filter frontend test -- --run frontend/src/hooks/__tests__/useSwipeInput.test.ts` with notes in `specs/002-support-mobile-play/tasks.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → completes before Foundational.
- **Foundational (Phase 2)** → depends on Setup; blocks all user stories.
- **User Story Phases (3–5)** → depend on Foundational; proceed in priority order (US1 → US2 → US3) though US2/US3 may start in parallel once US1 stabilizes.
- **Polish (Phase 6)** → waits until desired user stories are complete.

### User Story Dependencies

- **US1**: Requires Setup + Foundational completed; no dependency on other stories.
- **US2**: Requires Setup + Foundational; may start after US1 telemetry plumbing is merged to avoid conflicts in `sessionStore`.
- **US3**: Requires Setup + Foundational; depends on US1 telemetry fields to reuse latency/orientation metadata.

### Within Each User Story

- Create or update tests (Playwright/Vitest) before implementation tasks.
- Adjust shared state (`sessionStore`, telemetry) before UI wiring when the same file is touched.
- Complete telemetry hooks before adding announcement copy to ensure data is available for messaging.

### Parallel Opportunities

- T005 and T006 run in parallel after T004 due to separate files.
- Test tasks marked [P] within each story can run concurrently once shared helpers exist.
- US2 UI styling (T018) can proceed in parallel with telemetry updates (T019) after US1 merges.
- US3 persistence updates (T025) and announcement enhancements (T027) can occur in parallel after `useMobileViewport` (T023) lands.

---

## Parallel Example: User Story 1

```bash
# Run Playwright + Vitest coverage for mobile swipe while telemetry serialization work proceeds
pnpm --filter frontend test:e2e -- --project=mobile --grep "US1"
pnpm --filter frontend test -- --run frontend/src/hooks/__tests__/useSwipeInput.test.ts
pnpm --filter packages/ui-telemetry test -- --run tests/mobileTelemetry.test.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phases 1–2 to prepare fixtures, telemetry types, and test harnesses.
2. Deliver Phase 3 tasks so swipes work on mobile with telemetry + announcements.
3. Execute mobile Playwright + Vitest suites to validate MVP before iterating.

### Incremental Delivery

1. Merge US1 for swipe parity.
2. Layer US2 mobile controls to improve accessibility without touching swipe code.
3. Add US3 orientation/resume resilience to close the loop on continuity.
4. Finish with polish tasks to align docs, Storybook, and automated coverage.

### Parallel Team Strategy

- Developer A: Foundational telemetry/types (T004–T006) → US1 hook updates (T010–T013).
- Developer B: US2 controls (T014–T020) once US1 telemetry merges.
- Developer C: US3 orientation/resume (T021–T027) leveraging new hooks and persistence helpers.
- Shared effort: Phase 6 polish (T028–T030) after primary stories stabilize.

---

## Notes

- Maintain pure engine boundaries—only tests touch `packages/core`.
- Mark tasks complete after verifying associated tests or UI states.
- Keep telemetry payloads in sync with `contracts/mobile-move-event.openapi.yaml`.
- Ensure Storybook stories document both portrait and landscape layouts for review.
