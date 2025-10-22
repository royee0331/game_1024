# UI Telemetry Queue

`@browser-1024/ui-telemetry` provides a lightweight batching layer for client telemetry.
It accepts `TelemetryPayload` objects from `@browser-1024/core` and ensures they are
delivered to the configured endpoint without blocking the main thread.

## Payload Schema

Each payload matches the `TelemetryPayload` interface exported by `@browser-1024/core`:

| Field | Description |
| --- | --- |
| `sessionId` | Stable identifier for the active browser session. |
| `moveId` | Unique identifier for the emitted event (move counter or game-over tag). |
| `direction` | Direction of the originating input (`up`, `down`, `left`, `right`). |
| `scoreDelta` | Change in score produced by the input. |
| `boardHash` | Deterministic hash of the 4×4 matrix after resolution. |
| `latencyMs` | Milliseconds between input capture and animation start. |
| `seed` / `seedCursor` | Deterministic RNG metadata for replay verification. |
| `platform` | `{ userAgent, inputMode }` descriptor for the client. |
| `timestamp` | ISO-8601 timestamp when the event was recorded. |
| `event` | Event type (`move.completed`, `move.rejected`, or `game.over`). |

Batches are encoded as `{ events: TelemetryPayload[] }` before delivery.

## Delivery Strategy

1. **`navigator.sendBeacon`** – Used when available for non-blocking, background-safe uploads.
2. **`fetch` fallback** – If `sendBeacon` is unavailable or fails, the queue falls back to `fetch`
   with a JSON body and `POST` method. Custom fetch implementations can be provided for tests.
3. **Automatic Flushing** – The queue flushes when the batch reaches 25 items, on a periodic
   interval (default 4s), on `visibilitychange` to `hidden`, and on `beforeunload`.

Call `queue.stop()` during teardown to clear timers and flush remaining events synchronously.
