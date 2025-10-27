# Research Log: Browser 1024 Puzzle

## Session State Store for UI Shell
- **Decision**: Use Zustand to back the session store that bridges the pure engine with the React UI.
- **Rationale**: Zustand offers a tiny footprint, supports immutable-friendly patterns, integrates with React hooks without boilerplate, and allows persisting slices to LocalStorage while keeping computed selectors efficient for frequent board updates.
- **Alternatives Considered**:
  - **Redux Toolkit**: Provides strong tooling but adds ceremony and action boilerplate; unnecessary for a single-screen game.
  - **React Context + useReducer**: Lightweight but would trigger re-renders across the entire tree for every move unless manually memoized, complicating performance guarantees.

## Animation and Motion Library
- **Decision**: Combine CSS transform transitions with `framer-motion`'s `useSpring` hooks for nuanced easing while remaining GPU-friendly.
- **Rationale**: Native transforms deliver smooth 60fps animations; `framer-motion` simplifies spring curves and handles interruption when tiles merge quickly without writing bespoke physics math.
- **Alternatives Considered**:
  - **Pure CSS transitions**: Simplest to implement but lacks dynamic spring tuning and interruption control, leading to stutter on rapid input sequences.
  - **React Spring**: Powerful but heavier dependency and requires adapter layers to coordinate with existing motion utilities in the codebase.

## Telemetry Transport Strategy
- **Decision**: Buffer telemetry payloads client-side and flush via `navigator.sendBeacon` on each move completion with periodic fallbacks to `fetch` when Beacon is unavailable.
- **Rationale**: `sendBeacon` is non-blocking, works during page unload, and aligns with requirement to batch events for efficiency. Keeping a buffer allows us to coalesce moves without delaying UI feedback.
- **Alternatives Considered**:
  - **Immediate `fetch` per move**: Simple but risks blocking the main thread and violates batching requirement.
  - **Service Worker queue**: Robust but overkill for current scope and adds complexity to install/activate flows not requested in the spec.
