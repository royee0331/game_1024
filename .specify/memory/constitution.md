# Game 1024 Constitution
<!--
Sync Impact Report
Version change: N/A → 1.0.0
Modified principles: Initial ratification (all principles new)
Added sections:
- Core Principles
- Engineering Standards
- Delivery Workflow
- Governance
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
Follow-up TODOs: None
-->

## Core Principles

### I. Deterministic Core Engine (NON-NEGOTIABLE)
All tile movement, merging, scoring, and win/lose detection MUST be implemented as pure
functions that accept the full board state and explicit inputs (including RNG state) and
return the next state plus emitted events. No rendering, timers, or I/O side effects may
leak into `core/` modules. This guarantees reproducibility, enables exhaustive tests, and
keeps the engine portable across platforms.

### II. Seeded Random Emergence
All stochastic behavior (new tile spawns, shuffle mechanics, power-ups) MUST flow through a
seedable random provider that is injected from the UI shell. The provider MUST default to a
cryptographically strong source but accept deterministic seeds for testing and replays.
Implementation MUST surface the seed used for each session and log RNG draws for debugging
and replay export.

### III. Test-Gated Mechanics
Board logic, scoring rules, undo/redo stacks, and RNG sequencing MUST be covered by
executable specs before implementation work starts. Tests MUST prove idempotence,
commutativity of move compression, and correct event emission for every tile interaction.
A change is mergeable only when unit tests for core logic, integration tests for the
interaction loop, and snapshot tests for the UI pass.

### IV. Responsive Interaction Loop
Input handling, animation, and rendering MUST maintain a 16ms budget on the primary target
platform (desktop browsers). The UI layer MUST process input events synchronously, queue
state transitions from the core engine, and render animations using requestAnimationFrame.
Any blocking work MUST run off the main thread (e.g., via Web Workers) to preserve frame
rate.

### V. Accessible & Observable Play
The experience MUST remain fully playable via keyboard and touch controls, expose screen
reader-friendly labels for tiles, and emit structured telemetry for every move. Logs MUST
include board state hashes, scores, RNG seeds, and latency metrics so regressions can be
traced. Accessibility regressions block release until resolved.

## Engineering Standards
The canonical implementation uses TypeScript 5+, Vite, and a React-based UI hosted in a
`frontend/` workspace with a shared `packages/` directory for reusable logic. Core engine
code lives in `packages/core` with no DOM dependencies. UI composition resides in
`frontend/src`, while cross-cutting utilities belong in `packages/shared`.

State is represented as immutable data structures (arrays of tile objects with IDs, value,
and merge lineage). Engine functions MUST treat inputs as immutable and return new
instances. Communication between engine and UI happens via declarative events (e.g.,
`SpawnTile`, `MergeTiles`, `GameOver`).

Testing harnesses MUST rely on Vitest for unit coverage, Playwright for interaction tests,
and Storybook stories for visual regression baselines. Performance budgets target 60 FPS
with p95 input-to-animation latency under 80ms on reference hardware (Chromium desktop,
2022 MacBook Air). Build artifacts MUST include source maps and a playable static bundle.

## Delivery Workflow
Every feature begins with a specification that maps user scenarios to deterministic board
transitions and identifies telemetry needed for observability. Plans MUST document how each
principle is upheld, including RNG seeding strategy, performance constraints, and
accessibility accommodations.

Implementation follows this flow: write failing tests for core logic, update Storybook
examples, implement core modules in `packages/core`, integrate in the React UI, and finally
wire telemetry exports. Code reviews MUST include constitution compliance checks, verifying
pure functions, seeded randomness, test coverage, and accessibility instrumentation. Any
requested waivers MUST include a time-boxed remediation task.

## Governance
This constitution supersedes other project practices. Amendments require consensus from the
core maintainers, documentation of rationale, updated version tags, and validation that all
templates in `.specify/templates/` remain aligned. Violations discovered during reviews or
post-release MUST be logged, triaged within one business day, and resolved before the next
milestone.

**Version**: 1.0.0 | **Ratified**: 2025-10-22 | **Last Amended**: 2025-10-22
