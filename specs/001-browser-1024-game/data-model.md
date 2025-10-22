# Data Model: Browser 1024 Puzzle

## Overview
All stateful logic is encapsulated in immutable structures produced by the core engine. Each move accepts explicit inputs and returns new snapshots plus typed events to keep the UI, persistence layer, and telemetry sinks synchronized.

## Entities

### Tile
- **Fields**:
  - `id: string` — stable identifier for animation reconciliation.
  - `value: number` — powers of two from 2 to 1024+.
  - `row: number` / `col: number` — zero-based coordinates within 4×4 grid.
  - `mergedFrom?: [string, string]` — IDs of tiles merged to create this tile for animation lineage.
  - `isNew: boolean` — flag for spawn animation on current turn.
- **Constraints**:
  - Values must remain powers of two.
  - Coordinates always within `[0,3]` bounds.
  - `mergedFrom` defined only on tiles resulting from a merge this turn.

### BoardMatrix
- **Type**: `Tile | null` in a 4×4 matrix (`Tile[][]`).
- **Constraints**:
  - Exactly 16 positions.
  - No duplicate `Tile.id` references.
  - Null slots represent empty cells.

### GameState
- **Fields**:
  - `board: BoardMatrix` — immutable tile layout.
  - `score: number` — cumulative score.
  - `bestScore: number` — persisted personal best.
  - `moveCount: number` — increments on each successful move.
  - `seed: string` — base RNG seed identifier.
  - `seedCursor: number` — deterministic counter for RNG draws.
  - `pendingMoves: MoveCommand[]` — queue for buffered inputs during animations.
  - `undoStack: SessionSnapshot[]` — stack of previous states for single-step undo.
  - `status: "idle" | "animating" | "gameOver"` — coarse engine status.
- **Invariants**:
  - `bestScore >= score` except when new high score is recorded simultaneously (UI updates best score immediately).
  - `pendingMoves` empty whenever status is not `animating`.
  - `undoStack` depth limited (default 1) per spec’s optional undo.

### MoveCommand
- **Fields**:
  - `direction: "up" | "down" | "left" | "right"`
  - `requestedAt: number` — high-resolution timestamp (ms) captured at input.
  - `source: "keyboard" | "touch" | "assistive"` — for telemetry.

### EngineEvent
- **Variants**:
  - `TileMoved { id, from: {row, col}, to: {row, col} }`
  - `TileMerged { targetId, consumedIds, value, scoreDelta }`
  - `TileSpawned { id, value, position }`
  - `MoveRejected { reason }`
  - `GameOver { boardHash }`
- **Usage**: Emitted sequentially per command to drive UI animations and telemetry.

### SessionSnapshot
- **Fields**:
  - `state: GameState` — deep copy of previous frame.
  - `timestamp: number` — when snapshot captured.
  - `rngCursor: number` — alias of `seedCursor` at capture time.
- **Storage**: Serialized to LocalStorage key `browser-1024/session`.

### TelemetryPayload
- **Fields**:
  - `sessionId: string`
  - `moveId: string` — ULID for deduplication.
  - `direction: MoveCommand.direction`
  - `scoreDelta: number`
  - `boardHash: string` — deterministic hash of matrix for replay validation.
  - `latencyMs: number` — difference between input timestamp and animation start.
  - `seed: string`
  - `seedCursor: number`
  - `platform: { userAgent: string; inputMode: "keyboard" | "touch" | "assistive" }`
  - `timestamp: string` — ISO8601.
- **Constraints**:
  - Payload arrays are batched, length ≤ 25 per flush.

## Relationships & Flows
- `GameState` aggregates `BoardMatrix`, `Tile`, `MoveCommand`, and `SessionSnapshot` references.
- Engine consumes a `MoveCommand` and returns `{ nextState: GameState, events: EngineEvent[], telemetry: TelemetryPayload[] }`.
- UI updates LocalStorage by serializing `SessionSnapshot` after every committed move and storing `bestScore` separately for quick access.
- Telemetry queue collects `TelemetryPayload` entries until flush thresholds (time-based or count-based) are reached.

## Validation Rules
- Reject moves that neither merge nor shift tiles; emit `MoveRejected` and do not spawn new tiles.
- Detect `gameOver` when all cells occupied and no adjacent equal values exist in any direction.
- Undo operation pops `undoStack` and replays from snapshot with deterministic RNG cursor reset.

## State Transitions
1. **Input Received** → Queue `MoveCommand` if `status === "animating"`, else pass to engine.
2. **Engine Resolution** → Produce `nextState`, append `EngineEvent` sequence, bump `moveCount`, adjust `score`/`bestScore`.
3. **Spawn Tile** → Determined by seeded RNG; increments `seedCursor` and marks tile as `isNew`.
4. **Animation Cycle** → UI transitions tiles based on `EngineEvent`. When complete, `status` returns to `idle` and queued inputs drain FIFO.
5. **Game Over** → `status` set to `gameOver`, focus moved to restart control, telemetry includes `GameOver` event.
6. **Restart** → Reset board via deterministic seed, preserve `bestScore`, clear `undoStack` and `pendingMoves`.
