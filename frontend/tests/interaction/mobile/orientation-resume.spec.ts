import { test, expect } from '@playwright/test';
import { loadMobileFixture, performSwipe, tapButton } from './testHarness';

test.describe('orientation and resume continuity', () => {
  test('switches orientation and announces resume', async ({ page }) => {
    await loadMobileFixture(page, {
      fixture: 'fixture-mobile-resume-003',
      seed: 'seed-mobile-gamma-251022'
    });

    await tapButton(page, '[data-test="mobile-controls-toggle"]');
    const controls = page.locator('[data-test="mobile-controls"]');
    await expect(controls).toHaveClass(/mobile-controls--portrait/);

    await page.setViewportSize({ width: 640, height: 360 });
    await page.waitForTimeout(200);
    await expect(controls).toHaveClass(/mobile-controls--landscape/);

    await page.setViewportSize({ width: 360, height: 640 });
    await page.waitForTimeout(200);
    await expect(controls).toHaveClass(/mobile-controls--portrait/);

    await page.evaluate(() => {
      const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
      let current: 'hidden' | 'visible' = 'hidden';
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get() {
          return current;
        }
      });
      document.dispatchEvent(new Event('visibilitychange'));
      current = 'visible';
      document.dispatchEvent(new Event('visibilitychange'));
      if (descriptor) {
        delete (document as Document & { visibilityState?: string }).visibilityState;
        Object.defineProperty(Document.prototype, 'visibilityState', descriptor);
      }
    });

    await page.waitForTimeout(120);
    await expect(page.locator('[data-test="game-announcements"]')).toContainText('暂停');

    const grid = page.locator('.tile-grid');
    const box = await grid.boundingBox();
    if (box) {
      await performSwipe(
        page,
        { x: box.x + box.width - 24, y: box.y + box.height / 2 },
        { x: box.x + 24, y: box.y + box.height / 2 }
      );
    }
  });
});
