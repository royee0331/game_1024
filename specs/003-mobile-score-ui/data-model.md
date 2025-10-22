# Data Model: Mobile Scoreboard Layout & Completion Prompt

## ScoreHudViewModel
| Field | Type | Source | Notes |
|-------|------|--------|-------|
| score | number | `sessionStore.state.game.score` | Current session score formatted via shared formatter at render time |
| bestScore | number | `sessionStore.state.game.bestScore` | Persists across sessions; displayed even after restart |
| moveCount | number | `sessionStore.state.game.moveCount` | Increments per accepted engine move |
| layoutVariant | 'stacked' \| 'wide' | Derived from `useMobileViewport()` width breakpoints | Controls CSS class for grid vs. inline layout |
| ariaIds | { score: string; best: string; moves: string } | Generated per render using stable prefixes | Associates labels with numeric values for screen readers |

**State transitions**: `layoutVariant` flips to `stacked` when viewport width ≤480px or when `useMobileViewport()` reports portrait safe area narrower than 400px. No persistence required.

## GameEndPromptState
| Field | Type | Source | Notes |
|-------|------|--------|-------|
| visible | boolean | Derived from `sessionStore.state.game.status === 'gameOver'` | Controls modal mount/unmount |
| finalScore | number | `sessionStore.state.game.score` at transition time | Snapshot displayed in modal body |
| bestScore | number | `sessionStore.state.game.bestScore` | Reused to reassure player after restart |
| moveCount | number | `sessionStore.state.game.moveCount` | Included in summary copy |
| focusTarget | 'restart' \| 'dismiss' | Local component state | Tracks which button received focus when modal opened |
| sessionId | string | `sessionStore.state.game.sessionId` | Passed to telemetry payload |

**State transitions**:
1. When `status` becomes `gameOver`, the component captures `finalScore`, `bestScore`, `moveCount`, `sessionId`, and sets `visible = true`, `focusTarget = 'restart'`.
2. On restart action, component calls `sessionStore.restart()`, resets `focusTarget = 'restart'`, and hides modal once store status returns to `idle`.
3. On dismiss action, component hides modal but leaves `status = 'gameOver'` until restart occurs; `focusTarget` moves to `'dismiss'` to support re-entry.

## SessionRestartTelemetryEnvelope
| Field | Type | Source | Notes |
|-------|------|--------|-------|
| event | string | Constant `'session.restart'` | Distinguishes restart from other telemetry |
| sessionId | string | Captured prior to restart call | Links to finishing session |
| triggeredBy | string | Literal `'gameover-modal'` | Helps analytics compare entry points |
| bestScore | number | `GameEndPromptState.bestScore` | Confirms retention of historical best |
| timestamp | number | `Date.now()` when restart button clicked | Allows latency calculations |
| locale | string | `navigator.language` fallback to `'zh-CN'` | Helps evaluate localized copy performance |

**Emission**: Envelope pushes to `useTelemetryQueue` before invoking `restart()` so analytics receives the final state even if restart fails.
