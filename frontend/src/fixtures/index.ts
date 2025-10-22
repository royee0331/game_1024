import type { GameState, Tile } from '@core/types';

function cloneTile(tile: Tile): Tile {
  return { ...tile };
}

function cloneBoard(board: GameState['board']): GameState['board'] {
  return board.map((row) => row.map((cell) => (cell ? cloneTile(cell) : null)));
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    board: cloneBoard(state.board),
    pendingMoves: [...state.pendingMoves],
    undoStack: [...state.undoStack]
  };
}

const baseFixtures: Record<string, GameState> = {
  'fixture-start-001': {
    board: [
      [
        { id: 't-1', value: 2, row: 0, col: 0, isNew: false },
        null,
        null,
        { id: 't-2', value: 2, row: 0, col: 3, isNew: false }
      ],
      [
        { id: 't-3', value: 4, row: 1, col: 0, isNew: false },
        { id: 't-4', value: 4, row: 1, col: 1, isNew: false },
        null,
        null
      ],
      [
        null,
        { id: 't-5', value: 2, row: 2, col: 1, isNew: false },
        null,
        { id: 't-6', value: 2, row: 2, col: 3, isNew: false }
      ],
      [null, null, null, null]
    ],
    score: 0,
    bestScore: 0,
    moveCount: 0,
    seed: 'seed-alpha-221022',
    seedCursor: 0,
    pendingMoves: [],
    undoStack: [],
    status: 'idle',
    sessionId: 'session-fixture',
    lastMoveAt: undefined
  },
  'fixture-midgame-002': {
    board: [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, { id: 'm-1', value: 4, row: 2, col: 3, isNew: false }],
      [
        null,
        { id: 'm-2', value: 2, row: 3, col: 1, isNew: false },
        { id: 'm-3', value: 8, row: 3, col: 2, isNew: false },
        { id: 'm-4', value: 4, row: 3, col: 3, isNew: false }
      ]
    ],
    score: 128,
    bestScore: 256,
    moveCount: 12,
    seed: 'seed-alpha-221022',
    seedCursor: 0,
    pendingMoves: [],
    undoStack: [],
    status: 'idle',
    sessionId: 'session-fixture',
    lastMoveAt: undefined
  },
  'fixture-endgame-003': {
    board: [
      [
        { id: 'e-1', value: 64, row: 0, col: 0, isNew: false },
        { id: 'e-2', value: 32, row: 0, col: 1, isNew: false },
        { id: 'e-3', value: 64, row: 0, col: 2, isNew: false },
        { id: 'e-4', value: 32, row: 0, col: 3, isNew: false }
      ],
      [
        { id: 'e-5', value: 8, row: 1, col: 0, isNew: false },
        { id: 'e-6', value: 4, row: 1, col: 1, isNew: false },
        { id: 'e-7', value: 8, row: 1, col: 2, isNew: false },
        { id: 'e-8', value: 4, row: 1, col: 3, isNew: false }
      ],
      [
        { id: 'e-9', value: 16, row: 2, col: 0, isNew: false },
        { id: 'e-10', value: 8, row: 2, col: 1, isNew: false },
        { id: 'e-11', value: 16, row: 2, col: 2, isNew: false },
        { id: 'e-12', value: 8, row: 2, col: 3, isNew: false }
      ],
      [
        { id: 'e-13', value: 4, row: 3, col: 0, isNew: false },
        { id: 'e-14', value: 2, row: 3, col: 1, isNew: false },
        { id: 'e-15', value: 4, row: 3, col: 2, isNew: false },
        { id: 'e-16', value: 2, row: 3, col: 3, isNew: false }
      ]
    ],
    score: 512,
    bestScore: 768,
    moveCount: 32,
    seed: 'seed-gamma-221022',
    seedCursor: 64,
    pendingMoves: [],
    undoStack: [],
    status: 'idle',
    sessionId: 'session-fixture',
    lastMoveAt: undefined
  }
};

export function resolveFixture(name: string | null | undefined): GameState | null {
  if (!name) {
    return null;
  }
  const state = baseFixtures[name];
  if (!state) {
    return null;
  }
  return cloneState(state);
}
