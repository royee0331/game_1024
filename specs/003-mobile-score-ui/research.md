# Research Findings: Mobile Scoreboard Layout & Completion Prompt

## Decision 1: Responsive HUD uses CSS grid with stacked variant below 480px
- **Rationale**: CSS grid lets the current flex-based HUD convert into a single-column layout with predictable spacing using `grid-template-columns: repeat(3, minmax(88px, 1fr))` for desktop and `grid-template-columns: 1fr` for phones. This avoids runtime calculations and keeps layout updates within the render pass so score updates remain synchronous with engine moves. Grid also simplifies safe-area padding by applying margin and gap rules instead of per-metric overrides.
- **Alternatives considered**:
  - **JavaScript-driven layout toggles**: Rejected because it adds resize listeners and state churn without benefits beyond CSS media queries.
  - **Separate mobile component**: Rejected to prevent duplicated markup and localization logic for metric labels.
  - **CSS flex-wrap tweaks only**: Rejected because wrapping produces uneven column widths and unpredictable stacking when values grow beyond four digits.

## Decision 2: Game completion modal is an in-tree React component with manual focus trap
- **Rationale**: Rendering the modal alongside `GameScene` keeps dependencies minimal and allows reusing Zustand session state for visibility. A simple focus trap implemented with sentinels and `useRef` keeps bundle size down while satisfying accessibility requirements. Portal-based solutions are unnecessary since the modal overlays the existing scene root, and we can reuse the existing blur backdrop styles.
- **Alternatives considered**:
  - **Third-party modal library**: Rejected to avoid adding dependencies and to maintain styling control over safe-area padding.
  - **React portal**: Rejected because stacking context is already controlled inside `.game-scene`; portal would complicate SSR and testing without solving a real issue.
  - **Rely solely on GameAnnouncements banner**: Rejected; the banner lacks actionable buttons and does not halt interaction when no moves remain.

## Decision 3: Telemetry leverages existing queue with new `session.restart` envelope metadata
- **Rationale**: `useTelemetryQueue` already batches payloads from the session store; pushing a `session.restart` payload keeps analytics consistent and satisfies spec success criteria without backend changes. The modal simply invokes the existing `restart()` action, ensuring RNG seeds and session IDs continue to flow through the deterministic engine.
- **Alternatives considered**:
  - **New REST endpoint for modal confirmations**: Unnecessary; current telemetry endpoint already accepts arbitrary events.
  - **LocalStorage logging only**: Fails observability goals and would not surface in centralized dashboards.
  - **Delaying telemetry until next move**: Risks losing restart events if a user immediately closes the tab and violates success metrics.
