---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Engine**: `packages/core/` (pure logic, Vitest specs in `tests/unit/`)
- **Shared utilities**: `packages/shared/`
- **UI**: `frontend/src/` with Playwright specs in `frontend/tests/`
- **Fixtures**: `tests/fixtures/` for seeded board states and RNG transcripts
- Update paths if plan.md introduces additional workspaces, but preserve pure core boundaries

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment
  
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create monorepo structure (`packages/core`, `packages/shared`, `frontend/`)
- [ ] T002 Initialize Vite + React app with Storybook and Playwright harnesses
- [ ] T003 [P] Configure linting, formatting, and Vitest environment with jsdom & worker support
- [ ] T004 [P] Add CI workflow to run Vitest, Playwright, and Storybook snapshot checks

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T005 Define immutable `GameState`, `Tile`, and `EngineEvent` types in `packages/core`
- [ ] T006 [P] Implement seedable RNG provider with deterministic transcript logging
- [ ] T007 [P] Establish telemetry client in `packages/shared/telemetry.ts`
- [ ] T008 Configure accessibility testing (axe-core) and keyboard interaction fixtures
- [ ] T009 Setup state persistence & replay scaffolding in `frontend/src/state`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Vitest spec covering move resolution on fixture `[id]`
- [ ] T011 [P] [US1] Playwright test validating input-to-animation latency budget
- [ ] T012 [P] [US1] Storybook snapshot verifying accessibility annotations

### Implementation for User Story 1

- [ ] T013 [P] [US1] Implement `applyMove` branch logic in `packages/core/moves.ts`
- [ ] T014 [US1] Wire React input handler in `frontend/src/hooks/useInput.ts`
- [ ] T015 [US1] Render tile animation sequence in `frontend/src/components/TileGrid.tsx`
- [ ] T016 [US1] Persist RNG seed + move history in `frontend/src/state/sessionStore.ts`
- [ ] T017 [US1] Emit telemetry event with board hash + latency metrics

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T018 [P] [US2] Vitest spec covering RNG replay consistency for fixture `[id]`
- [ ] T019 [P] [US2] Playwright test validating undo/redo interactions stay under latency budget
- [ ] T020 [P] [US2] Storybook visual regression for new UI elements

### Implementation for User Story 2

- [ ] T021 [P] [US2] Extend engine events for feature (e.g., power-ups) in `packages/core/events.ts`
- [ ] T022 [US2] Update state adapters in `frontend/src/state` to consume new events
- [ ] T023 [US2] Enhance animations/feedback in `frontend/src/components`
- [ ] T024 [US2] Extend telemetry + accessibility hooks for new interactions

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T025 [P] [US3] Vitest spec stress-testing merge chains + score calculations
- [ ] T026 [P] [US3] Playwright regression for multi-input gesture handling
- [ ] T027 [P] [US3] Storybook snapshot for accessibility mode visuals

### Implementation for User Story 3

- [ ] T028 [P] [US3] Extend `packages/core` scoring pipeline with new rules
- [ ] T029 [US3] Update `frontend/src/scenes` to expose feature toggle & UI
- [ ] T030 [US3] Document new telemetry fields in `docs/telemetry.md`

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring while preserving pure engine boundaries
- [ ] TXXX Performance optimization with profiling traces logged for moves
- [ ] TXXX [P] Additional unit tests (if requested) in tests/unit/ ensuring seeded reproducibility
- [ ] TXXX Security & privacy review for telemetry payloads
- [ ] TXXX Run quickstart.md validation with seeded replay fixtures

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

  ```bash
  # Launch all tests for User Story 1 together (if tests requested):
  vitest run tests/unit/us1.move.spec.ts --run
  playwright test frontend/tests/interaction/us1.spec.ts
  storybook test --coverage frontend/.storybook

  # Launch all engine updates for User Story 1 together:
  Task: "Implement applyMove branch logic in packages/core/moves.ts"
  Task: "Update seeded fixtures in tests/fixtures/us1.json"
  ```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
