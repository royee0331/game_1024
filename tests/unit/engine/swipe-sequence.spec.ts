import { describe, it, expect } from 'vitest';
import { applyMove } from '@core/engine/applyMove';
import { createSeededPrng } from '@core/random/prng';
import type { GameState } from '@core/types';
import { loadFixture } from '../fixtures';

describe('swipe sequence midgame replay', () => {
  it('produces deterministic board and score over up then right', () => {
    const initialState = loadFixture('fixture-midgame-002');
    const base: GameState = {
      ...initialState,
      seed: 'seed-beta-221022',
      seedCursor: 0
    };

    const upPrng = createSeededPrng(base.seed, base.seedCursor);
    const upResult = applyMove(base, upPrng, {
      command: { direction: 'up', source: 'touch', requestedAt: 1_000 },
      platform: { userAgent: 'vitest', inputMode: 'touch' },
      sessionId: base.sessionId,
      now: 1_020
    });

    const rightPrng = createSeededPrng(upResult.nextState.seed, upResult.nextState.seedCursor);
    const rightResult = applyMove(upResult.nextState, rightPrng, {
      command: { direction: 'right', source: 'touch', requestedAt: 1_060 },
      platform: { userAgent: 'vitest', inputMode: 'touch' },
      sessionId: base.sessionId,
      now: 1_090
    });

    const matrix = rightResult.nextState.board.map((row) => row.map((cell) => cell?.value ?? 0));
    const firstDelta = upResult.nextState.score - base.score;
    const secondDelta = rightResult.nextState.score - upResult.nextState.score;
    expect(matrix).toEqual([
      [0, 2, 4, 16],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    expect(firstDelta + secondDelta).toBe(28);
    expect(rightResult.nextState.moveCount).toBe(base.moveCount + 2);
    expect(upResult.telemetry[0]).toMatchObject({ event: 'move.completed', direction: 'up', scoreDelta: firstDelta });
    expect(rightResult.telemetry[0]).toMatchObject({ event: 'move.completed', direction: 'right', scoreDelta: secondDelta });
  });
});
