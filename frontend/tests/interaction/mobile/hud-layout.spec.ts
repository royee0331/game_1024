import { test, expect } from '@playwright/test';
import { loadHudCompactScenario, performSwipe } from './testHarness';

test.describe('mobile hud layout', () => {
  test('stacks metrics and preserves aria associations', async ({ page }) => {
    await loadHudCompactScenario(page);

    const hud = page.locator('.hud');
    await expect(hud).toHaveAttribute('data-layout', 'stacked');
    await expect(hud).toHaveAttribute('role', 'status');

    const metrics = hud.locator('.hud__metric');
    await expect(metrics).toHaveCount(3);

    const boxes = await metrics.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom };
      })
    );

    for (let index = 1; index < boxes.length; index += 1) {
      const previous = boxes[index - 1];
      const current = boxes[index];
      expect.soft(current.top - previous.bottom).toBeGreaterThanOrEqual(16);
      expect.soft(previous.top).toBeLessThan(current.top);
    }

    const ariaPairs = await metrics.evaluateAll((elements) =>
      elements.map((element) => {
        const labelId = element.getAttribute('aria-labelledby') ?? '';
        const valueId = element.getAttribute('aria-describedby') ?? '';
        const label = labelId ? document.getElementById(labelId)?.textContent?.trim() ?? '' : '';
        const value = valueId ? document.getElementById(valueId)?.textContent?.trim() ?? '' : '';
        return { label, value };
      })
    );

    expect(ariaPairs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: '当前得分' }),
        expect.objectContaining({ label: '最佳成绩' }),
        expect.objectContaining({ label: '步数' })
      ])
    );

    const grid = page.locator('.tile-grid');
    const bounds = await grid.boundingBox();
    if (!bounds) {
      throw new Error('tile grid not rendered');
    }

    await performSwipe(
      page,
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height - 24 },
      { x: bounds.x + bounds.width / 2, y: bounds.y + 24 }
    );

    await expect(page.locator('[data-test="score-value"]')).toHaveText('4');
    await expect(page.locator('[data-test="best-score-value"]')).toHaveText('2,304');
    await expect(page.locator('[data-test="move-count-value"]')).toHaveText('1');
  });
});
