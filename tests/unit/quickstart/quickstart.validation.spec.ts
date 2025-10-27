import { describe, it, expect, vi } from 'vitest';
import { resolveFixture } from '../../../frontend/src/fixtures';
import { createBeaconQueue } from '../../../packages/ui-telemetry/src/beaconQueue';
import type { TelemetryPayload } from '@core/types';

describe('quickstart validation', () => {
  it('loads deterministic fixture state', () => {
    const fixture = resolveFixture('fixture-endgame-003');
    expect(fixture).not.toBeNull();
    expect(fixture?.board.flat().filter(Boolean).length).toBe(16);
    expect(fixture?.seed).toBe('seed-gamma-221022');
  });

  it('flushes telemetry batches to fetch fallback', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    const queue = createBeaconQueue({
      endpoint: '/api/telemetry',
      flushIntervalMs: 0,
      fetchImpl: fetchSpy,
      sendBeacon: () => false
    });

    const payload: TelemetryPayload = {
      sessionId: 'session-test',
      moveId: 'move-001',
      direction: 'up',
      scoreDelta: 0,
      boardHash: 'hash-001',
      latencyMs: 12,
      seed: 'seed-alpha-221022',
      seedCursor: 42,
      platform: { userAgent: 'vitest', inputMode: 'assistive' },
      timestamp: new Date().toISOString(),
      event: 'game.over'
    };

    queue.enqueue(payload);
    await queue.flush();
    queue.stop();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/telemetry');
    expect(init?.method).toBe('POST');
    expect(init?.body).toContain('game.over');
  });
});
