import { useEffect, useRef } from 'react';
import type { BeaconQueue } from '@ui-telemetry/beaconQueue';
import { createBeaconQueue } from '@ui-telemetry/beaconQueue';
import { useSessionStore } from '../state/sessionStore';

const TELEMETRY_ENDPOINT = '/api/telemetry';

export function useTelemetryQueue(): void {
  const consumeTelemetry = useSessionStore((state) => state.consumeTelemetry);
  const pendingTelemetry = useSessionStore((state) => state.pendingTelemetry);
  const queueRef = useRef<BeaconQueue | null>(null);

  useEffect(() => {
    const queue = createBeaconQueue({ endpoint: TELEMETRY_ENDPOINT, flushIntervalMs: 2_000 });
    queueRef.current = queue;
    return () => {
      queue.stop();
      queueRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!queueRef.current || pendingTelemetry.length === 0) {
      return;
    }
    const payloads = consumeTelemetry();
    payloads.forEach((payload) => {
      queueRef.current?.enqueue(payload);
    });
  }, [consumeTelemetry, pendingTelemetry]);
}
