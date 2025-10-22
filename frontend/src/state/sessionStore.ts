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
  loadBestScore,
  clearSession
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
  restart(): void;
}

const BOARD_SIZE = 4;
const DEFAULT_SEED = 'seed-alpha-221022';

let initialSeed = DEFAULT_SEED;
let initialFixture: string | null = null;

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

function createSeededOpeningState(bestScore: number): GameState {
  const sessionId = generateSessionId();
  const fixture = resolveFixture(initialFixture);
  const canReuseFixture =
    fixture !== null && fixture.score === 0 && fixture.moveCount === 0 && fixture.seed === initialSeed;

  const baseState = canReuseFixture ? { ...fixture, board: settleBoard(fixture.board) } : createBaseState(initialSeed, sessionId);

  const board = settleBoard(baseState.board);
  return {
    ...baseState,
    board,
    score: 0,
    bestScore: Math.max(bestScore, baseState.bestScore ?? 0),
    moveCount: 0,
    seed: initialSeed,
    seedCursor: 0,
    pendingMoves: [],
    undoStack: [],
    status: 'idle',
    sessionId,
    lastMoveAt: undefined
  };
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
  initialSeed = requestedSeed || DEFAULT_SEED;
  initialFixture = fixtureName;
  const sessionId = generateSessionId();

  let baseState = resolveFixture(fixtureName) ?? createBaseState(initialSeed, sessionId);
  baseState.seed = initialSeed;
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
    if (state.game.status === 'gameOver') {
      return;
    }
    const command: MoveCommand = {
      direction,
      source,
      requestedAt: Date.now()
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
      isAnimating: result.nextState.status === 'animating'
    });
  },
  completeAnimation() {
    const state = get();
    const [nextCommand, ...rest] = state.pendingCommands;
    const settledBoard = settleBoard(state.game.board);
    const targetStatus = state.game.status === 'gameOver' ? 'gameOver' : 'idle';
    const baseGame: GameState = {
      ...state.game,
      board: settledBoard,
      status: targetStatus,
      pendingMoves: targetStatus === 'gameOver' ? [] : rest
    };

    if (!nextCommand || targetStatus === 'gameOver') {
      set({
        game: baseGame,
        events: [],
        pendingCommands: targetStatus === 'gameOver' ? [] : rest,
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
      isAnimating: result.nextState.status === 'animating'
    });
  },
  consumeTelemetry() {
    const payloads = get().pendingTelemetry;
    set({ pendingTelemetry: [] });
    return payloads;
  },
  restart() {
    const state = get();
    const nextState = createSeededOpeningState(state.game.bestScore);
    clearSession();
    persistState(nextState);
    set({
      game: nextState,
      events: [],
      pendingTelemetry: [],
      pendingCommands: [],
      isAnimating: false
    });
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
