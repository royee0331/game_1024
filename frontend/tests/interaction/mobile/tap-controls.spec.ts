import { test, expect } from '@playwright/test';
import { loadMobileFixture, tapButton } from './testHarness';

test.describe('mobile tap controls', () => {
  test('perform up then right tap moves with telemetry metadata', async ({ page }) => {
    const telemetry = await loadMobileFixture(page, {
      fixture: 'fixture-mobile-midgame-002',
      seed: 'seed-mobile-beta-251022'
    });

    await tapButton(page, '[data-test="mobile-controls-toggle"]');
    await tapButton(page, '[data-test="mobile-control-up"]');
    await page.waitForTimeout(220);
    await tapButton(page, '[data-test="mobile-control-right"]');
    await page.waitForTimeout(260);

    const moves = await page.textContent('[data-test="move-count-value"]');
    expect(moves?.replace(/\D/g, '')).not.toBe('0');

    const envelopes = telemetry.events;
    const events = envelopes.flatMap((entry) => {
      const candidate = entry.events;
      return Array.isArray(candidate) ? (candidate as Array<Record<string, unknown>>) : [];
    });

    const tapEvents = events.filter((payload) => payload['gestureType'] === 'tap');
    expect(tapEvents.length).toBeGreaterThanOrEqual(2);
    tapEvents.forEach((payload) => {
      expect(payload['deviceCategory']).toBe('mobile');
      expect(payload['event']).toBe('move.completed');
    });
  });
});
