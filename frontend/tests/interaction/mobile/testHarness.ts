import { expect, type Page } from '@playwright/test';

export interface TelemetryCapture {
  events: Array<Record<string, unknown>>;
  reset(): void;
}

export interface LoadFixtureOptions {
  fixture: string;
  seed: string;
  viewport?: { width: number; height: number };
  routePattern?: string;
}

export async function setMobileViewport(
  page: Page,
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<void> {
  if (orientation === 'portrait') {
    await page.setViewportSize({ width: 360, height: 640 });
    return;
  }
  await page.setViewportSize({ width: 640, height: 360 });
}

export async function setupTelemetryCapture(
  page: Page,
  pattern = '**/api/telemetry'
): Promise<TelemetryCapture> {
  const envelopes: Array<Record<string, unknown>> = [];

  await page.route(pattern, async (route, request) => {
    const payload = request.postData();
    if (payload) {
      try {
        const parsed = JSON.parse(payload) as Record<string, unknown>;
        envelopes.push(parsed);
      } catch (error) {
        console.warn('[testHarness] Failed to parse telemetry payload', error);
      }
    }
    await route.fulfill({ status: 202, body: '' });
  });

  return {
    events: envelopes,
    reset() {
      envelopes.splice(0, envelopes.length);
    }
  };
}

export async function loadMobileFixture(
  page: Page,
  options: LoadFixtureOptions
): Promise<TelemetryCapture> {
  const { fixture, seed, viewport, routePattern } = options;
  await setMobileViewport(page, 'portrait');
  if (viewport) {
    await page.setViewportSize(viewport);
  }

  const capture = await setupTelemetryCapture(page, routePattern);
  await page.goto(`/?fixture=${fixture}&seed=${seed}`);
  await page.waitForSelector('.tile-grid');
  return capture;
}

export async function performSwipe(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number }
): Promise<void> {
  await page.evaluate(
    ({ fromPoint, toPoint }) => {
      const steps = 6;
      const target = document.elementFromPoint(fromPoint.x, fromPoint.y) ?? document.body;
      const dispatch = (type: string, point: { x: number; y: number }) => {
        const event = new PointerEvent(type, {
          pointerId: 41,
          pointerType: 'touch',
          clientX: point.x,
          clientY: point.y,
          bubbles: true,
          cancelable: true
        });
        target?.dispatchEvent(event);
      };
      dispatch('pointerdown', fromPoint);
      for (let index = 1; index <= steps; index += 1) {
        const progress = index / steps;
        const position = {
          x: fromPoint.x + (toPoint.x - fromPoint.x) * progress,
          y: fromPoint.y + (toPoint.y - fromPoint.y) * progress
        };
        dispatch('pointermove', position);
      }
      dispatch('pointerup', toPoint);
    },
    { fromPoint: from, toPoint: to }
  );
}

export async function tapButton(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
  await element.click({ force: true });
}
