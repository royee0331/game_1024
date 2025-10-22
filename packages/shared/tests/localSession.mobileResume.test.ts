import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, MoveCommand } from '@core/types';
import {
  clearSession,
  hydrateInitialState,
  saveSessionSnapshot,
  getLastResumeMetadata
} from '../src/storage/localSession';

function createBaseState(): GameState {
  const emptyRow = () => [null, null, null, null];
  return {
    board: [emptyRow(), emptyRow(), emptyRow(), emptyRow()],
    score: 0,
    bestScore: 0,
    moveCount: 0,
    seed: 'seed-test',
    seedCursor: 0,
    pendingMoves: [],
    undoStack: [],
    status: 'idle',
    sessionId: 'session-test',
    lastMoveAt: undefined
  };
}

describe('localSession mobile resume metadata', () => {
  beforeEach(() => {
    clearSession();
  });

  it('persists and exposes resume metadata alongside the snapshot', () => {
    const state = createBaseState();
    const pending: MoveCommand[] = [
      { direction: 'left', requestedAt: 42, source: 'tap' }
    ];
    const queue: MoveCommand[] = [
      { direction: 'up', requestedAt: 48, source: 'touch' }
    ];

    saveSessionSnapshot({
      state: { ...state, score: 32 },
      timestamp: 1_234,
      rngCursor: 12,
      pendingCommands: pending,
      gestureQueue: queue,
      lastVisibleAt: 9_876,
      orientation: 'landscape'
    });

    const hydrated = hydrateInitialState(state);
    expect(hydrated.score).toBe(32);

    const metadata = getLastResumeMetadata();
    expect(metadata?.orientation).toBe('landscape');
    expect(metadata?.lastVisibleAt).toBe(9_876);
    expect(metadata?.pendingCommands).toHaveLength(1);
    expect(metadata?.pendingCommands?.[0].direction).toBe('left');
    expect(metadata?.gestureQueue).toHaveLength(1);
    expect(metadata?.gestureQueue?.[0].direction).toBe('up');
  });

  it('clears metadata when the session is cleared', () => {
    const state = createBaseState();
    saveSessionSnapshot({ state, timestamp: 0, rngCursor: 0 });
    hydrateInitialState(state);
    clearSession();
    expect(getLastResumeMetadata()).toBeNull();
  });
});
