import { create } from 'zustand';
import {
  applyMove
} from '@core/engine/applyMove';
import { createSeededPrng } from '@core/random/prng';
import type {
  Direction,
  EngineEvent,
  GameState,
  InputSource,
  MoveCommand,
  TelemetryPayload
} from '@core/types';
import {
  hydrateInitialState,
  saveSessionSnapshot,
  loadBestScore
} from '@shared/storage/localSession';
import { resolveFixture } from '../fixtures';

interface SessionStoreState {
  game: GameState;
  events: EngineEvent[];
  pendingTelemetry: TelemetryPayload[];
  pendingCommands: MoveCommand[];
  isAnimating: boolean;
  enqueueMove(direction: Direction, source: InputSource): void;
  completeAnimation(): void;
  consumeTelemetry(): TelemetryPayload[];
  hydrate(game: GameState): void;
}

const BOARD_SIZE = 4;
const DEFAULT_SEED = 'seed-alpha-221022';

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEmptyBoard(): GameState['board'] {
  return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null));
}

function createBaseState(seed: string, sessionId: string): GameState {
  const board = createEmptyBoard();
  board[0][0] = { id: `${seed}-a`, value: 2, row: 0, col: 0, isNew: true };
  board[1][1] = { id: `${seed}-b`, value: 2, row: 1, col: 1, isNew: true };

  return {
    board,
    score: 0,
    bestScore: 0,
    moveCount: 0,
    seed,
    seedCursor: 0,
    pendingMoves: [],
    undoStack: [],
    status: 'idle',
    sessionId,
    lastMoveAt: undefined
  };
}

function settleBoard(board: GameState['board']): GameState['board'] {
  return board.map((row) => row.map((cell) => (cell ? { ...cell, isNew: false } : null)));
}

function sanitizeStateForStorage(state: GameState): GameState {
  return {
    ...state,
    pendingMoves: [],
    undoStack: state.undoStack.map((snapshot) => ({
      ...snapshot,
      state: {
        ...snapshot.state,
        pendingMoves: [],
        undoStack: []
      }
    }))
  };
}

function persistState(state: GameState): void {
  if (typeof window === 'undefined') {
    return;
  }
  const sanitized = sanitizeStateForStorage(state);
  saveSessionSnapshot({
    state: sanitized,
    timestamp: Date.now(),
    rngCursor: state.seedCursor
  });
}

function resolveMoveResult(game: GameState, command: MoveCommand) {
  const prng = createSeededPrng(game.seed, game.seedCursor);
  const sessionId = game.sessionId ?? generateSessionId();
  const result = applyMove(game, prng, {
    command,
    platform: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      inputMode: command.source
    },
    sessionId,
    now: Date.now()
  });
  result.nextState.sessionId = sessionId;
  persistState(result.nextState);
  return result;
}

function bootstrapGameState(): GameState {
  const isBrowser = typeof window !== 'undefined';
  const params = isBrowser ? new URLSearchParams(window.location.search) : null;
  const requestedSeed = (params?.get('seed') ?? DEFAULT_SEED).trim();
  const fixtureName = params?.get('fixture');
  const sessionId = generateSessionId();

  let baseState = resolveFixture(fixtureName) ?? createBaseState(requestedSeed, sessionId);
  baseState.seed = requestedSeed;
  baseState.sessionId = baseState.sessionId ?? sessionId;

  if (!isBrowser) {
    return baseState;
  }

  baseState.bestScore = Math.max(baseState.bestScore, loadBestScore());
  const hydrated = hydrateInitialState(baseState);
  return {
    ...hydrated,
    sessionId: hydrated.sessionId ?? baseState.sessionId ?? sessionId
  };
}

const initialGameState = bootstrapGameState();

export const useSessionStore = create<SessionStoreState>((set, get) => ({
  game: initialGameState,
  events: [],
  pendingTelemetry: [],
  pendingCommands: [],
  isAnimating: false,
  enqueueMove(direction, source) {
    const state = get();
    const command: MoveCommand = {
      direction,
      source,
      requestedAt: typeof performance !== 'undefined' ? performance.now() : Date.now()
    };

    if (state.isAnimating || state.pendingCommands.length > 0) {
      set({
        pendingCommands: [...state.pendingCommands, command],
        game: {
          ...state.game,
          pendingMoves: [...state.game.pendingMoves, command]
        }
      });
      return;
    }

    const result = resolveMoveResult(state.game, command);
    set({
      game: result.nextState,
      events: result.events,
      pendingTelemetry: [...state.pendingTelemetry, ...result.telemetry],
      pendingCommands: [],
      isAnimating: true
    });
  },
  completeAnimation() {
    const state = get();
    const [nextCommand, ...rest] = state.pendingCommands;
    const settledBoard = settleBoard(state.game.board);
    const baseGame: GameState = {
      ...state.game,
      board: settledBoard,
      status: 'idle',
      pendingMoves: rest
    };

    if (!nextCommand) {
      set({
        game: baseGame,
        events: [],
        isAnimating: false
      });
      return;
    }

    const result = resolveMoveResult(baseGame, nextCommand);
    set({
      game: result.nextState,
      events: result.events,
      pendingTelemetry: [...state.pendingTelemetry, ...result.telemetry],
      pendingCommands: rest,
      isAnimating: true
    });
  },
  consumeTelemetry() {
    const payloads = get().pendingTelemetry;
    set({ pendingTelemetry: [] });
    return payloads;
  },
  hydrate(game) {
    set({
      game,
      events: [],
      pendingTelemetry: [],
      pendingCommands: [],
      isAnimating: false
    });
  }
}));
