# Data Model: Mobile Browser Play Support

## Entity: TouchInputSession
- **Purpose**: Track a single active touch gesture from pointer down through dispatch to prevent duplicate moves and to populate telemetry fields.
- **Fields**:
  - `pointerId: number | null` — active pointer reference from PointerEvent.
  - `startX: number` — clientX at gesture start.
  - `startY: number` — clientY at gesture start.
  - `startTime: number` — high-resolution timestamp captured on pointer down.
  - `resolvedDirection: Direction | null` — command direction once the 60px threshold is met.
  - `gestureType: 'swipe' | 'tap'` — distinguishes swipe gestures from on-screen button taps.
  - `triggered: boolean` — prevents duplicate dispatch for a single pointer sequence.
- **Relationships**: Lives inside `useSwipeInput` hook and feeds `MoveCommand` objects enqueued in `useSessionStore`.
- **Validation/Rules**:
  - `resolvedDirection` may only be non-null when `triggered` is true.
  - The gesture is cleared when pointer IDs change, the pointer is canceled, or after dispatch.
  - Telemetry latency uses `performance.now() - startTime`.

## Entity: ViewportLayoutProfile
- **Purpose**: Describe the responsive layout values required to scale the board, controls, and HUD for the current orientation and viewport.
- **Fields**:
  - `orientation: 'portrait' | 'landscape'` — derived from width/height comparison.
  - `width: number` / `height: number` — viewport dimensions in CSS pixels.
  - `safeAreaInsets: { top: number; right: number; bottom: number; left: number }` — values from `env(safe-area-inset-*)`.
  - `tileSize: number` — computed tile dimension using CSS clamp tokens (px).
  - `gridGap: number` — spacing between tiles.
  - `hudScale: number` — multiplier for typography and spacing of score HUD.
  - `controlsPlacement: 'bottom' | 'side'` — indicates where MobileControls render based on orientation.
- **Relationships**: Produced by `useMobileViewport` hook and consumed by `GameScene`, `MobileControls`, and `TileGrid` layout props.
- **Validation/Rules**:
  - `tileSize` must keep a 4×4 grid within viewport width minus safe-area insets.
  - `hudScale` should stay within `[0.85, 1.15]` to preserve legibility.
  - Orientation changes emit a debounced profile update once per animation frame.

## Entity: MobileInteractionLog
- **Purpose**: Structured telemetry payload appended to the existing move event queue to capture mobile-specific metadata.
- **Fields**:
  - `sessionId: string` — inherited from `GameState`.
  - `moveId: string` — deterministic identifier for each dispatched move.
  - `deviceCategory: 'mobile'` — constant for this feature.
  - `gestureType: 'swipe' | 'tap'` — matches `TouchInputSession.gestureType`.
  - `orientation: 'portrait' | 'landscape'` — orientation at dispatch time.
  - `latencyMs: number` — time between gesture start and move dispatch.
  - `seed: string` — RNG seed used for the move.
  - `seedCursor: number` — cursor position before the move for replay fidelity.
  - `resumeAt?: number` — timestamp when the session resumed, present if dispatch followed a background interval.
- **Relationships**: Stored in `useSessionStore` pending telemetry queue, published through `@browser-1024/ui-telemetry` transport.
- **Validation/Rules**:
  - `latencyMs` must be <120 to satisfy success criteria; values ≥120 trigger warning logs.
  - `resumeAt` is optional and included only if the previous visibility state was `hidden`.
  - Payload is serialized alongside existing move events without introducing a new event type.

## Entity: ResumeSnapshot
- **Purpose**: Persist deterministic state so sessions resume seamlessly after backgrounding.
- **Fields**:
  - `state: GameState` — sanitized snapshot without pending moves.
  - `pendingCommands: MoveCommand[]` — queued inputs awaiting animation completion.
  - `gestureQueue: Array<{ direction: Direction; source: InputSource; requestedAt: number }>` — serialized representation of commands to restore after resume.
  - `lastVisibleAt: number` — timestamp when the tab was last active.
  - `orientation: 'portrait' | 'landscape'` — orientation stored for resume toast messaging.
- **Relationships**: Persisted via `@browser-1024/shared/storage/localSession`, hydrated inside `useSessionStore` on load or visibility change.
- **Validation/Rules**:
  - Snapshot writes occur on animation completion or visibility transitions, not during mid-frame rendering.
  - Hydration verifies `seed` and `seedCursor` match the current session before replaying commands.

## Entity: AnnouncementQueue
- **Purpose**: Manage user-facing messages (move results, resume toast) for both visual and screen-reader delivery.
- **Fields**:
  - `messages: Array<{ id: string; content: string; priority: 'normal' | 'high'; expiresAt?: number }>` — queue of announcements.
  - `ariaLiveMode: 'polite' | 'assertive'` — indicates how to surface announcements.
  - `acknowledgedResumeAt?: number` — timestamp when the latest resume message was acknowledged, preventing duplicates.
- **Relationships**: Backed by Zustand slice or `GameAnnouncements` component context, consumes updates from session resume events.
- **Validation/Rules**:
  - Resume announcements auto-expire after 6 seconds unless the user triggers an input sooner.
  - Only one high-priority message may exist at a time to avoid overwhelming screen readers.
