import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

test.describe('game over accessibility', () => {
  test('announces status via live region', async ({ page }) => {
    await page.goto('/?fixture=fixture-endgame-003&seed=seed-gamma-221022');
    await page.waitForSelector('[data-test="tile-position-3-3"]');

    await page.keyboard.press('ArrowUp');

    const announcement = page.locator('[data-test="game-announcements"]');
    await expect(announcement).toContainText('无可用移动，按回车重新开始');

    const accessibilityScan = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScan.violations).toEqual([]);
  });
});
