import { useEffect, useRef } from 'react';
import type { BeaconQueue } from '@ui-telemetry/beaconQueue';
import { createBeaconQueue } from '@ui-telemetry/beaconQueue';
import { useSessionStore } from '../state/sessionStore';

const TELEMETRY_ENDPOINT = '/api/telemetry';

export function useTelemetryQueue(): void {
  const consumeTelemetry = useSessionStore((state) => state.consumeTelemetry);
  const pendingTelemetry = useSessionStore((state) => state.pendingTelemetry);
  const registerTelemetry = useSessionStore((state) => state.registerTelemetry);
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
    registerTelemetry(payloads);
    let containsGameOver = false;
    let containsMobileMove = false;
    let containsRestart = false;
    payloads.forEach((payload) => {
      if (payload.event === 'game.over') {
        containsGameOver = true;
      }
      if (payload.deviceCategory === 'mobile' && payload.event === 'move.completed') {
        containsMobileMove = true;
      }
      if (payload.event === 'session.restart') {
        containsRestart = true;
      }
      queueRef.current?.enqueue(payload);
    });
    if (containsGameOver || containsMobileMove || containsRestart) {
      void queueRef.current.flush();
    }
  }, [consumeTelemetry, pendingTelemetry, registerTelemetry]);
}
