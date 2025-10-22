# Quickstart: Mobile Browser Play Support

## 1. Install & bootstrap
1. `pnpm install`
2. `pnpm --filter frontend dev` and open `http://localhost:5173/?fixture=fixture-mobile-opening-001&seed=seed-mobile-alpha-251022`
3. Toggle the device toolbar in the browser devtools and set the viewport to 360×640 to emulate a phone.

## 2. Verify touch gestures
1. On the running dev server, perform a single-finger swipe left.
2. Confirm the board merges into `[[0,0,0,0],[0,0,0,0],[0,0,0,0],[4,4,2,0]]`, score increases by `8`, and a toast confirms the move latency.
3. Trigger multi-touch (two-finger) swipes to ensure the UI ignores secondary input and displays the no-move prompt.

## 3. Test on-screen controls
1. Enable the “Mobile Controls” overlay via the HUD toggle.
2. Tap the Up and Right buttons; verify the board result `[[0,0,8,4],[0,0,0,0],[0,0,0,0],[0,0,0,2]]` and VoiceOver/SpeechSynthesis narrations.
3. Inspect elements to ensure each button has `aria-label` and is reachable via keyboard Tab order.

## 4. Exercise orientation & resume
1. Rotate the emulator to landscape; confirm the board centers and controls move to the side.
2. Background the tab for 90 seconds, then return; verify the resume toast and that a new swipe still triggers immediately.
3. Check local storage `browser-1024/session` key for persisted `seedCursor`, `gestureQueue`, and `lastVisibleAt` values.

## 5. Run automated coverage
1. `pnpm --filter packages/shared test` – validates persistence helpers.
2. `pnpm --filter frontend test:e2e:mobile` – runs the dedicated Playwright mobile suites across portrait and landscape.
3. `pnpm --filter frontend test -- --run tests/hooks/useSwipeInput.test.ts` – executes hook-level regression tests.
4. `pnpm --filter frontend storybook` – open Storybook and review the “Mobile Controls” story at 320px and 768px viewports.

## 6. Telemetry validation
1. With the dev server running, open the network inspector and filter for `telemetry` requests.
2. Perform a swipe and confirm the payload includes `deviceCategory: "mobile"`, `gestureType`, `orientation`, `latencyMs`, and `resumeAt` when returning from the background.
3. Repeat after rotating the device to ensure `orientation` updates to `landscape` and mobile moves flush immediately.
