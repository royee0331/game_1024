import { useEffect } from 'react';
import { useSessionStore } from '../state/sessionStore';

const DEFAULT_THRESHOLD = 80;

export function usePerformanceMetrics(thresholdMs = DEFAULT_THRESHOLD): void {
  const pendingTelemetry = useSessionStore((state) => state.pendingTelemetry);

  useEffect(() => {
    if (pendingTelemetry.length === 0) {
      return;
    }

    for (const payload of pendingTelemetry) {
      if (payload.event !== 'move.completed') {
        continue;
      }
      if (payload.latencyMs > thresholdMs) {
        console.warn('[performance] Move latency exceeded threshold', {
          latencyMs: payload.latencyMs,
          thresholdMs,
          direction: payload.direction
        });
      }
    }
  }, [pendingTelemetry, thresholdMs]);
}
