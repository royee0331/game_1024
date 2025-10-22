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
  'fixture-mobile-opening-001': {
    board: [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [
        { id: 'mobile-open-a', value: 2, row: 3, col: 0, isNew: false },
        { id: 'mobile-open-b', value: 2, row: 3, col: 1, isNew: false },
        { id: 'mobile-open-c', value: 2, row: 3, col: 2, isNew: false },
        { id: 'mobile-open-d', value: 2, row: 3, col: 3, isNew: false }
      ]
    ],
    score: 0,
    bestScore: 0,
    moveCount: 0,
    seed: 'seed-mobile-alpha-251022',
    seedCursor: 0,
    pendingMoves: [],
    undoStack: [],
    status: 'idle',
    sessionId: 'session-mobile-open',
    lastMoveAt: undefined
  },
  'fixture-mobile-midgame-002': {
    board: [
      [null, null, null, null],
      [
        { id: 'mobile-mid-a', value: 4, row: 1, col: 0, isNew: false },
        null,
        null,
        { id: 'mobile-mid-b', value: 4, row: 1, col: 3, isNew: false }
      ],
      [
        { id: 'mobile-mid-c', value: 2, row: 2, col: 0, isNew: false },
        null,
        { id: 'mobile-mid-d', value: 2, row: 2, col: 2, isNew: false },
        null
      ],
      [
        null,
        { id: 'mobile-mid-e', value: 4, row: 3, col: 1, isNew: false },
        null,
        { id: 'mobile-mid-f', value: 2, row: 3, col: 3, isNew: false }
      ]
    ],
    score: 64,
    bestScore: 128,
    moveCount: 10,
    seed: 'seed-mobile-beta-251022',
    seedCursor: 0,
    pendingMoves: [],
    undoStack: [],
    status: 'idle',
    sessionId: 'session-mobile-mid',
    lastMoveAt: undefined
  },
  'fixture-mobile-resume-003': {
    board: [
      [
        { id: 'mobile-resume-a', value: 4, row: 0, col: 0, isNew: false },
        { id: 'mobile-resume-b', value: 2, row: 0, col: 1, isNew: false },
        null,
        null
      ],
      [null, null, { id: 'mobile-resume-c', value: 4, row: 1, col: 2, isNew: false }, null],
      [null, null, null, null],
      [
        { id: 'mobile-resume-d', value: 2, row: 3, col: 0, isNew: false },
        null,
        null,
        { id: 'mobile-resume-e', value: 2, row: 3, col: 3, isNew: false }
      ]
    ],
    score: 48,
    bestScore: 128,
    moveCount: 8,
    seed: 'seed-mobile-gamma-251022',
    seedCursor: 0,
    pendingMoves: [],
    undoStack: [],
    status: 'idle',
    sessionId: 'session-mobile-resume',
    lastMoveAt: undefined
  },
  'fixture-mobile-hud-compact-001': {
    board: [
      [
        null,
        { id: 'hud-compact-a', value: 512, row: 0, col: 1, isNew: false },
        null,
        { id: 'hud-compact-b', value: 16, row: 0, col: 3, isNew: false }
      ],
      [
        { id: 'hud-compact-c', value: 2, row: 1, col: 0, isNew: false },
        null,
        { id: 'hud-compact-d', value: 64, row: 1, col: 2, isNew: false },
        null
      ],
      [
        { id: 'hud-compact-e', value: 2, row: 2, col: 0, isNew: false },
        { id: 'hud-compact-f', value: 8, row: 2, col: 1, isNew: false },
        null,
        { id: 'hud-compact-g', value: 4, row: 2, col: 3, isNew: false }
      ],
      [
        { id: 'hud-compact-h', value: 8, row: 3, col: 0, isNew: false },
        null,
        { id: 'hud-compact-i', value: 2, row: 3, col: 2, isNew: false },
        null
      ]
    ],
    score: 0,
    bestScore: 2304,
    moveCount: 0,
    seed: 'seed-hud-compact-251022',
    seedCursor: 0,
    pendingMoves: [],
    undoStack: [],
    status: 'idle',
    sessionId: 'session-mobile-hud-compact',
    lastMoveAt: undefined
  },
  'fixture-mobile-gameover-001': {
    board: [
      [
        { id: 'go-a', value: 32, row: 0, col: 0, isNew: false },
        { id: 'go-e', value: 64, row: 0, col: 1, isNew: false },
        { id: 'go-i', value: 128, row: 0, col: 2, isNew: false },
        { id: 'go-m', value: 256, row: 0, col: 3, isNew: false }
      ],
      [
        { id: 'go-b', value: 1024, row: 1, col: 0, isNew: false },
        { id: 'go-f', value: 32, row: 1, col: 1, isNew: false },
        { id: 'go-j', value: 64, row: 1, col: 2, isNew: false },
        { id: 'go-n', value: 128, row: 1, col: 3, isNew: false }
      ],
      [
        { id: 'go-c', value: 2048, row: 2, col: 0, isNew: false },
        { id: 'go-g', value: 16, row: 2, col: 1, isNew: false },
        { id: 'go-k', value: 32, row: 2, col: 2, isNew: false },
        { id: 'go-o', value: 64, row: 2, col: 3, isNew: false }
      ],
      [
        { id: 'go-d', value: 2048, row: 3, col: 0, isNew: false },
        { id: 'go-h', value: 8, row: 3, col: 1, isNew: false },
        { id: 'go-l', value: 16, row: 3, col: 2, isNew: false },
        { id: 'go-p', value: 32, row: 3, col: 3, isNew: false }
      ]
    ],
    score: 0,
    bestScore: 4096,
    moveCount: 75,
    seed: 'seed-gameover-251022',
    seedCursor: 0,
    pendingMoves: [],
    undoStack: [],
    status: 'idle',
    sessionId: 'session-mobile-gameover',
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
