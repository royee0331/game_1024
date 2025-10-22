import { test, expect } from '@playwright/test';
import { loadGameOverScenario, performSwipe } from './testHarness';

test.describe('game over modal prompt', () => {
  test('appears after final move with focus trap and metrics', async ({ page }) => {
    await loadGameOverScenario(page);

    const grid = page.locator('.tile-grid');
    const bounds = await grid.boundingBox();
    if (!bounds) {
      throw new Error('tile grid not rendered');
    }

    const start = Date.now();
    await performSwipe(
      page,
      { x: bounds.x + bounds.width / 2, y: bounds.y + 24 },
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height - 24 }
    );

    await page.waitForSelector('[data-test="game-over-modal"] .game-modal__dialog');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(450);

    const modal = page.locator('[data-test="game-over-modal"]');
    await expect(modal.locator('.game-modal__title')).toHaveText('挑战完成');
    await expect(modal.locator('.game-modal__metric').nth(0).locator('dd')).toHaveText('4,096');
    await expect(modal.locator('.game-modal__metric').nth(1).locator('dd')).toHaveText('4,096');
    await expect(modal.locator('.game-modal__metric').nth(2).locator('dd')).toHaveText('76');

    const restartButton = modal.locator('.game-modal__primary');
    await expect(restartButton).toBeFocused();
    const dismissButton = modal.locator('.game-modal__secondary');

    await page.keyboard.press('Tab');
    await expect(dismissButton).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(restartButton).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    await expect(page.locator('[data-test="game-announcements"]')).toContainText('挑战完成，可随时重新开始');
  });
});
