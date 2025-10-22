import { test, expect } from '@playwright/test';
import { loadMobileFixture, performSwipe } from './testHarness';

test.describe('mobile swipe interactions', () => {
  test('left swipe merges tiles and emits enriched telemetry', async ({ page }) => {
    const telemetry = await loadMobileFixture(page, {
      fixture: 'fixture-mobile-opening-001',
      seed: 'seed-mobile-alpha-251022'
    });

    const grid = page.locator('.tile-grid');
    const box = await grid.boundingBox();
    if (!box) {
      throw new Error('Tile grid bounding box unavailable');
    }

    await performSwipe(
      page,
      { x: box.x + box.width - 24, y: box.y + box.height / 2 },
      { x: box.x + 24, y: box.y + box.height / 2 }
    );

    await page.waitForTimeout(240);

    await expect(page.locator('[data-test="tile-position-3-0"][data-test-value="4"]')).toBeVisible();
    await expect(page.locator('[data-test="tile-position-3-1"][data-test-value="4"]')).toBeVisible();
    await expect(page.locator('[data-test="tile-position-3-2"][data-test-value="2"]')).toBeVisible();

    const scoreText = await page.textContent('[data-test="score-value"]');
    expect(scoreText?.replace(/\D/g, '')).toBe('8');

    const envelopes = telemetry.events;
    expect(envelopes.length).toBeGreaterThan(0);
    const events = envelopes.flatMap((entry) => {
      const candidate = entry.events;
      return Array.isArray(candidate) ? (candidate as Array<Record<string, unknown>>) : [];
    });

    const moveEvent = events.find((payload) => payload['event'] === 'move.completed');
    expect(moveEvent).toBeDefined();
    expect(moveEvent?.['deviceCategory']).toBe('mobile');
    expect(moveEvent?.['gestureType']).toBe('swipe');
    expect(moveEvent?.['orientation']).toBe('portrait');
    const latency = Number(moveEvent?.['latencyMs'] ?? 0);
    expect(Number.isFinite(latency)).toBe(true);
    expect(latency).toBeLessThan(300);
  });
});
