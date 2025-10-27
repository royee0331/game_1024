import { describe, it, expect, vi, afterEach } from 'vitest';
import { createBeaconQueue } from '../src/beaconQueue';
import { isMobileInteractionLog } from '../src/mobilePayload';
import type { TelemetryPayload } from '@core/types';

const basePayload: TelemetryPayload = {
  sessionId: 'session-mobile',
  moveId: 'seed-1-0',
  direction: 'left',
  scoreDelta: 8,
  boardHash: 'hash-mobile-alpha-001',
  latencyMs: 72,
  seed: 'seed-mobile-alpha-251022',
  seedCursor: 2,
  platform: { userAgent: 'test-agent', inputMode: 'touch' },
  timestamp: new Date(0).toISOString(),
  event: 'move.completed'
};

describe('mobile telemetry payloads', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retains mobile fields when enqueued and flushed', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    const queue = createBeaconQueue({
      endpoint: 'https://example.test/telemetry',
      fetchImpl: fetchMock,
      flushIntervalMs: 0
    });

    const payload = {
      ...basePayload,
      deviceCategory: 'mobile' as const,
      gestureType: 'swipe' as const,
      orientation: 'portrait' as const,
      resumeAt: Date.now()
    };

    queue.enqueue(payload);
    await queue.flush();
    queue.stop();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0];
    const body = typeof request?.body === 'string' ? request.body : '';
    const parsed = JSON.parse(body) as { events: Array<Record<string, unknown>> };
    expect(parsed.events[0]['deviceCategory']).toBe('mobile');
    expect(parsed.events[0]['gestureType']).toBe('swipe');
    expect(parsed.events[0]['orientation']).toBe('portrait');
    expect(parsed.events[0]['resumeAt']).toBe(payload.resumeAt);
  });

  it('type guard identifies mobile interaction logs', () => {
    const payload = {
      ...basePayload,
      deviceCategory: 'mobile' as const,
      gestureType: 'tap' as const,
      orientation: 'landscape' as const
    };

    expect(isMobileInteractionLog(payload)).toBe(true);
    expect(
      isMobileInteractionLog({
        ...payload,
        deviceCategory: 'desktop'
      })
    ).toBe(false);
  });
});
