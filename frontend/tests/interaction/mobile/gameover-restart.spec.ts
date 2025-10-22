import { test, expect } from '@playwright/test';
import { loadGameOverScenario, performSwipe } from './testHarness';

test.describe('game over restart flow (mobile)', () => {
  test('restarts from modal and emits telemetry', async ({ page }) => {
    const capture = await loadGameOverScenario(page);

    const grid = page.locator('.tile-grid');
    const bounds = await grid.boundingBox();
    if (!bounds) {
      throw new Error('tile grid not rendered');
    }

    await performSwipe(
      page,
      { x: bounds.x + bounds.width / 2, y: bounds.y + 24 },
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height - 24 }
    );

    const modal = page.locator('[data-test="game-over-modal"]');
    await expect(modal).toBeVisible();
    await modal.locator('.game-modal__primary').click();

    await expect(modal).toBeHidden();
    await expect(page.locator('[data-test="score-value"]')).toHaveText('0');
    await expect(page.locator('[data-test="move-count-value"]')).toHaveText('0');
    await expect(page.locator('[data-test="best-score-value"]')).toHaveText('4,096');
    await expect(page.locator('[data-test="mobile-controls-toggle"]')).toBeFocused();

    const restartEvents = () =>
      capture.events.flatMap((entry) => {
        const envelope = entry as { events?: Array<Record<string, unknown>> };
        return Array.isArray(envelope.events) ? envelope.events : [];
      });

    await expect
      .poll(
        () =>
          restartEvents().filter((event) => (event as { event?: string }).event === 'session.restart').length
      )
      .toBeGreaterThan(0);

    const sessionRestart = restartEvents().find(
      (event) => (event as { event?: string }).event === 'session.restart'
    ) as
      | (Record<string, unknown> & { triggeredBy?: string })
      | undefined;
    expect(sessionRestart?.triggeredBy).toBe('gameover-modal');
  });
});
