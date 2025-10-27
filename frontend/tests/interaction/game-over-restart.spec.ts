import { test, expect } from '@playwright/test';

test.describe('game over restart flow', () => {
  test('moves focus and preserves best score', async ({ page }) => {
    const captured: string[] = [];

    await page.route('**/api/telemetry', async (route, request) => {
      const payload = request.postData();
      if (payload) {
        captured.push(payload);
      }
      await route.fulfill({ status: 204, body: '' });
    });

    await page.goto('/?fixture=fixture-endgame-003&seed=seed-gamma-221022');
    await page.waitForSelector('[data-test="tile-position-3-3"]');

    await page.keyboard.press('ArrowUp');

    const modal = page.locator('[data-test="game-over-modal"]');
    await expect(modal).toBeVisible();

    await page.keyboard.press('Enter');

    await page.waitForSelector('[data-test="tile-position-0-0"][data-test-value="2"]');
    await expect(page.locator('[data-test="tile-position-1-1"][data-test-value="2"]')).toBeVisible();

    const score = await page.textContent('[data-test="score-value"]');
    expect(score?.replace(/\D/g, '')).toBe('0');
    const best = await page.textContent('[data-test="best-score-value"]');
    expect(best?.replace(/\D/g, '')).toBe('768');

    const telemetryEvents = captured
      .map((entry) => {
        try {
          return JSON.parse(entry) as { events?: Array<{ event: string }> };
        } catch {
          return null;
        }
      })
      .flatMap((envelope) => envelope?.events ?? []);

    expect(telemetryEvents.some((event) => event.event === 'game.over')).toBe(true);
    expect(telemetryEvents.some((event) => event.event === 'session.restart')).toBe(true);
  });
});
