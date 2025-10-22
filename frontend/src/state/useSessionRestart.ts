import { useCallback } from 'react';
import { useSessionStore } from './sessionStore';
import type { SessionRestartTelemetryPayload } from '@core/types';

export type RestartSource = 'gameover-modal' | 'restart-button';

function resolveLocale(): string {
  if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
    return navigator.language;
  }
  return 'zh-CN';
}

export function useSessionRestart(source: RestartSource): () => void {
  const restart = useSessionStore((state) => state.restart);
  const enqueueTelemetry = useSessionStore((state) => state.enqueueTelemetry);
  const bestScore = useSessionStore((state) => state.game.bestScore);
  const sessionId = useSessionStore((state) => state.game.sessionId ?? 'unknown-session');

  return useCallback(() => {
    const timestamp = new Date().toISOString();
    const telemetry: SessionRestartTelemetryPayload = {
      event: 'session.restart',
      sessionId,
      timestamp,
      triggeredBy: source,
      bestScore,
      locale: resolveLocale()
    };
    enqueueTelemetry(telemetry);
    restart();
  }, [bestScore, enqueueTelemetry, restart, sessionId, source]);
}
