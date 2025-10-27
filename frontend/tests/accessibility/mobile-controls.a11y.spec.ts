import { test, expect } from '@playwright/test';
import { loadMobileFixture, tapButton } from '../interaction/mobile/testHarness';

test.describe('mobile controls accessibility', () => {
  test('buttons expose aria labels and maintain focus order', async ({ page }) => {
    await loadMobileFixture(page, {
      fixture: 'fixture-mobile-midgame-002',
      seed: 'seed-mobile-beta-251022'
    });

    await tapButton(page, '[data-test="mobile-controls-toggle"]');

    const controls = page.locator('[data-test^="mobile-control-"]');
    await expect(controls).toHaveCount(4);

    const expected = new Map([
      ['mobile-control-up', '向上移动'],
      ['mobile-control-right', '向右移动'],
      ['mobile-control-down', '向下移动'],
      ['mobile-control-left', '向左移动']
    ]);

    for (const [testId, label] of expected) {
      const button = page.locator(`[data-test="${testId}"]`);
      await expect(button).toHaveAttribute('aria-label', label);
    }

    // Validate focus traversal includes the toggle then each control.
    const focusOrder: string[] = [];
    for (let index = 0; index < 5; index += 1) {
      await page.keyboard.press('Tab');
      const activeTestId = await page.evaluate(() => document.activeElement?.getAttribute('data-test'));
      if (activeTestId) {
        focusOrder.push(activeTestId);
      }
    }

    expect(focusOrder).toEqual([
      'mobile-controls-toggle',
      'mobile-control-up',
      'mobile-control-left',
      'mobile-control-right',
      'mobile-control-down'
    ]);
  });
});
