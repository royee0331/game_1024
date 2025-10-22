# Quickstart: Implementing Mobile Scoreboard Layout & Completion Prompt

1. **Update HUD component and styles**
   - Convert `frontend/src/components/Hud.tsx` to expose label `id` props and wrap metrics in a grid container that flips to a stacked layout when `layoutVariant === 'stacked'`.
   - Extend `frontend/src/styles/global.css` with media queries for widths ≤480px (stack metrics vertically) and add safe-area aware padding; ensure `.hud__metric` values remain center aligned and support long text.
   - Add any HUD-specific overrides to `frontend/src/styles/mobile.css` for portrait spacing if safe areas require extra top margin.

2. **Introduce the game over modal**
   - Create `frontend/src/components/GameOverModal.tsx` that subscribes to session state, renders final metrics, traps focus between primary and secondary buttons, and emits `session.restart` telemetry before calling `restart()`.
   - Apply overlay styles (backdrop blur, safe-area padding) in `global.css`, ensuring the modal appears within `.game-scene` stacking context.
   - Update `frontend/src/scenes/GameScene.tsx` to mount the modal component and prevent duplicate announcements by gating `GameAnnouncements` when the modal is visible.

3. **Adjust session state helpers and telemetry**
   - Reuse `useSessionStore` selectors for final score, move count, and session id; expose a memoized selector if repeated by multiple components.
   - Ensure `RestartButton` continues to work by delegating to shared restart handler used by the modal so telemetry and board reset logic stay consistent.
   - Update `frontend/src/components/GameAnnouncements.tsx` to reduce the message when `status === 'gameOver'` so the modal copy leads the experience.

4. **Add regression coverage**
   - Implement Playwright specs under `frontend/tests/interaction/mobile/` for HUD layout, modal display, and restart flow using seeded fixtures noted in the spec.
   - Capture new visual baselines (Storybook story or Playwright screenshot) verifying stacked HUD arrangement at 360×640.
   - Run `pnpm lint`, `pnpm test`, and the scoped Playwright mobile suite to confirm accessibility assertions and telemetry routes succeed.
