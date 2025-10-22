import { test, expect } from '@playwright/test';

test.describe('keyboard merge flow', () => {
  test('resolves left move with deterministic spawn and telemetry', async ({ page }) => {
    const captured: string[] = [];

    await page.route('**/api/telemetry', async (route, request) => {
      captured.push(request.postData() ?? '');
      await route.fulfill({ status: 204, body: '' });
    });

    await page.goto('/?fixture=fixture-start-001&seed=seed-alpha-221022');
    await page.waitForSelector('[data-test="tile-value-2"]');

    await page.keyboard.press('ArrowLeft');

    await page.waitForSelector('[data-test="tile-position-0-2"][data-test-new="true"]');
    const score = await page.textContent('[data-test="score-value"]');
    expect(score).toContain('16');

    await page.waitForTimeout(100);
    expect(captured.length).toBeGreaterThan(0);
    const payload = JSON.parse(captured[captured.length - 1]);
    expect(Array.isArray(payload.events)).toBe(true);
    const event = payload.events.at(-1);
    expect(event.event).toBe('move.completed');
    expect(event.scoreDelta).toBe(16);
  });
});
