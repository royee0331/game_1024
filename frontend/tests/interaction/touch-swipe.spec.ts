import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

interface TelemetryEnvelope {
  events?: Array<{ direction: string; event: string; scoreDelta: number }>;
}

test.describe('touch swipe progression', () => {
  async function swipe(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
    await page.evaluate(
      ({ fromPoint, toPoint }) => {
        const steps = 8;
        const target = document.elementFromPoint(fromPoint.x, fromPoint.y) ?? document.body;
        const dispatch = (type: string, point: { x: number; y: number }) => {
          const event = new PointerEvent(type, {
            pointerId: 42,
            pointerType: 'touch',
            clientX: point.x,
            clientY: point.y,
            bubbles: true,
            cancelable: true
          });
          target?.dispatchEvent(event);
        };
        dispatch('pointerdown', fromPoint);
        for (let step = 1; step <= steps; step += 1) {
          const t = step / steps;
          const point = {
            x: fromPoint.x + (toPoint.x - fromPoint.x) * t,
            y: fromPoint.y + (toPoint.y - fromPoint.y) * t
          };
          dispatch('pointermove', point);
        }
        dispatch('pointerup', toPoint);
      },
      { fromPoint: from, toPoint: to }
    );
  }

  test('executes up then right with persistence and telemetry', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const captured: TelemetryEnvelope[] = [];

    await page.route('**/api/telemetry', async (route, request) => {
      const payload = request.postData();
      if (payload) {
        try {
          captured.push(JSON.parse(payload) as TelemetryEnvelope);
        } catch (error) {
          console.warn('Failed to parse telemetry payload', error);
        }
      }
      await route.fulfill({ status: 204, body: '' });
    });

    await page.goto('/?fixture=fixture-midgame-002&seed=seed-beta-221022');
    await page.waitForSelector('[data-test="tile-position-3-2"]');

    const grid = page.locator('.tile-grid');
    const box = await grid.boundingBox();
    if (!box) {
      throw new Error('Tile grid bounding box unavailable');
    }

    const centerX = box.x + box.width / 2;
    await swipe(
      page,
      { x: centerX, y: box.y + box.height - 12 },
      { x: centerX, y: box.y + 16 }
    );

    await page.waitForTimeout(180);

    const midY = box.y + box.height / 2;
    await swipe(
      page,
      { x: box.x + 24, y: midY },
      { x: box.x + box.width - 16, y: midY }
    );

    await page.waitForTimeout(260);

    await expect(page.locator('[data-test="tile-position-0-2"][data-test-value="4"]')).toBeVisible();
    await expect(page.locator('[data-test="tile-position-0-3"][data-test-value="16"]')).toBeVisible();

    const score = await page.textContent('[data-test="score-value"]');
    expect(score?.replace(/\D/g, '')).toBe('156');
    const best = await page.textContent('[data-test="best-score-value"]');
    expect(best?.replace(/\D/g, '')).toBe('256');
    const moves = await page.textContent('[data-test="move-count-value"]');
    expect(moves?.replace(/\D/g, '')).toBe('14');

    const events = captured.flatMap((entry) => entry.events ?? []);
    const upEvent = events.find((event) => event.direction === 'up');
    const rightEvent = events.find((event) => event.direction === 'right');
    expect(upEvent?.event).toBe('move.completed');
    expect(rightEvent?.event).toBe('move.completed');
    const combinedDelta = (upEvent?.scoreDelta ?? 0) + (rightEvent?.scoreDelta ?? 0);
    expect(combinedDelta).toBe(28);
  });
});
