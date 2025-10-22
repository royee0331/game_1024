import { describe, it, expect } from 'vitest';
import { applyMove } from '@core/engine/applyMove';
import { createSeededPrng } from '@core/random/prng';
import type { GameState } from '@core/types';
import { loadFixture } from '../fixtures';

function values(board: GameState['board']): number[][] {
  return board.map((row) => row.map((cell) => cell?.value ?? 0));
}

describe('applyMove keyboard left', () => {
  it('merges tiles deterministically and spawns via RNG cursor', () => {
    const initialState = loadFixture('fixture-start-001');
    const command = { direction: 'left' as const, requestedAt: 1_000, source: 'keyboard' as const };
    const prng = createSeededPrng(initialState.seed, initialState.seedCursor);

    const { nextState, events, telemetry } = applyMove(initialState, prng, {
      command,
      platform: { userAgent: 'vitest', inputMode: 'keyboard' },
      sessionId: initialState.sessionId,
      now: 1_032
    });

    expect(values(nextState.board)).toEqual([
      [4, 0, 2, 0],
      [8, 0, 0, 0],
      [4, 0, 0, 0],
      [0, 0, 0, 0]
    ]);

    expect(nextState.score).toBe(16);
    expect(nextState.moveCount).toBe(initialState.moveCount + 1);
    expect(nextState.seedCursor).toBe(initialState.seedCursor + 2);
    expect(nextState.bestScore).toBe(16);

    const spawnEvent = events.find((event) => event.type === 'TileSpawned');
    expect(spawnEvent).toBeDefined();
    if (spawnEvent?.type === 'TileSpawned') {
      expect(spawnEvent.position).toEqual({ row: 0, col: 2 });
      expect(spawnEvent.value).toBe(2);
    }

    const mergeEvents = events.filter((event) => event.type === 'TileMerged');
    expect(mergeEvents).toHaveLength(3);
    expect(telemetry).toHaveLength(1);
    expect(telemetry[0]).toMatchObject({
      event: 'move.completed',
      scoreDelta: 16,
      seedCursor: initialState.seedCursor + 2,
      direction: 'left'
    });
  });
});
