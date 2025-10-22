import { create } from 'zustand';
import {
  applyMove
} from '@core/engine/applyMove';
import { createSeededPrng } from '@core/random/prng';
import type {
  DeviceCategory,
  Direction,
  EngineEvent,
  GameState,
  GestureType,
  InputSource,
  MoveCommand,
  Orientation,
  TelemetryPayload
} from '@core/types';
import {
  hydrateInitialState,
  saveSessionSnapshot,
  loadBestScore,
  clearSession,
  getLastResumeMetadata
} from '@shared/storage/localSession';
import { resolveFixture } from '../fixtures';

interface GestureMetadata {
  gestureType?: GestureType;
  startedAt?: number;
  latencyMs?: number;
  deviceCategory?: DeviceCategory;
  orientation?: Orientation;
  resumeAt?: number;
}

interface PendingCommand {
  command: MoveCommand;
  metadata?: GestureMetadata;
}

interface LastGesture {
  type: GestureType;
  latencyMs: number;
  completedAt: number;
}

export interface SessionStoreState {
  game: GameState;
  events: EngineEvent[];
  pendingTelemetry: TelemetryPayload[];
  pendingCommands: PendingCommand[];
  isAnimating: boolean;
  orientation: Orientation;
  lastGesture: LastGesture | null;
  resumeAt: number | null;
  noMovePromptAt: number | null;
  lastVisibleAt: number | null;
  enqueueMove(direction: Direction, source: InputSource, metadata?: GestureMetadata): void;
  completeAnimation(): void;
  consumeTelemetry(): TelemetryPayload[];
  hydrate(game: GameState): void;
  restart(): void;
  setOrientation(orientation: Orientation): void;
  setResumeAt(timestamp: number | null): void;
  setNoMovePrompt(timestamp: number | null): void;
  setLastVisible(timestamp: number | null): void;
  registerTelemetry(payloads: TelemetryPayload[]): void;
  persistSnapshot(): void;
}

const BOARD_SIZE = 4;
const DEFAULT_SEED = 'seed-alpha-221022';

let initialSeed = DEFAULT_SEED;
let initialFixture: string | null = null;

function detectOrientation(): Orientation {
  if (typeof window === 'undefined') {
    return 'portrait';
  }
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

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

function persistState(
  state: GameState,
  metadata: { pendingCommands: PendingCommand[]; orientation: Orientation; lastVisibleAt: number | null }
): void {
  if (typeof window === 'undefined') {
    return;
  }
  const sanitized = sanitizeStateForStorage(state);
  const queuedCommands = state.pendingMoves.length > 0 ? state.pendingMoves : metadata.pendingCommands.map((entry) => entry.command);
  saveSessionSnapshot({
    state: sanitized,
    timestamp: Date.now(),
    rngCursor: state.seedCursor,
    pendingCommands: metadata.pendingCommands.map((entry) => entry.command),
    gestureQueue: queuedCommands,
    lastVisibleAt: metadata.lastVisibleAt ?? undefined,
    orientation: metadata.orientation
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
  return result;
}

function enrichTelemetryPayloads(
  payloads: TelemetryPayload[],
  metadata: GestureMetadata | undefined,
  orientation: Orientation,
  resumeAt: number | null
): TelemetryPayload[] {
  if (!metadata && resumeAt == null) {
    return payloads;
  }

  return payloads.map((payload) => {
    if (payload.event === 'move.completed' || payload.event === 'move.rejected' || payload.event === 'game.over') {
      const enriched: TelemetryPayload = {
        ...payload,
        latencyMs: metadata?.latencyMs ?? payload.latencyMs,
        orientation: metadata?.orientation ?? orientation,
        deviceCategory: metadata?.deviceCategory ?? payload.deviceCategory,
        gestureType: metadata?.gestureType ?? payload.gestureType,
        resumeAt: metadata?.resumeAt ?? (resumeAt ?? undefined)
      };
      return enriched;
    }
    return payload;
  });
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
const initialResumeMetadata = getLastResumeMetadata();
const initialOrientation = initialResumeMetadata?.orientation ?? detectOrientation();
const initialLastVisibleAt = initialResumeMetadata?.lastVisibleAt ?? null;

export const useSessionStore = create<SessionStoreState>((set, get) => ({
  game: initialGameState,
  events: [],
  pendingTelemetry: [],
  pendingCommands: [],
  isAnimating: false,
  orientation: initialOrientation,
  lastGesture: null,
  resumeAt: null,
  noMovePromptAt: null,
  lastVisibleAt: initialLastVisibleAt,
  enqueueMove(direction, source, metadata) {
    const state = get();
    if (state.game.status === 'gameOver') {
      return;
    }

    const command: MoveCommand = {
      direction,
      source,
      requestedAt: Date.now()
    };

    const pendingEntry: PendingCommand = { command, metadata };

    if (state.isAnimating || state.pendingCommands.length > 0) {
      set({
        pendingCommands: [...state.pendingCommands, pendingEntry],
        game: {
          ...state.game,
          pendingMoves: [...state.game.pendingMoves, command]
        }
      });
      return;
    }

    const resumeStamp = metadata?.resumeAt ?? state.resumeAt ?? null;
    const telemetryMetadata = metadata || resumeStamp ? { ...metadata, resumeAt: resumeStamp ?? undefined } : undefined;
    const result = resolveMoveResult(state.game, command);
    const telemetry = enrichTelemetryPayloads(result.telemetry, telemetryMetadata, state.orientation, resumeStamp);
    const primaryTelemetry = telemetry[0];
    const latency = metadata?.latencyMs ?? (primaryTelemetry ? primaryTelemetry.latencyMs : 0);
    const gestureRecord =
      metadata?.gestureType && Number.isFinite(latency)
        ? {
            type: metadata.gestureType,
            latencyMs: latency,
            completedAt: Date.now()
          }
        : state.lastGesture;

    set({
      game: result.nextState,
      events: result.events,
      pendingTelemetry: [...state.pendingTelemetry, ...telemetry],
      pendingCommands: [],
      isAnimating: result.nextState.status === 'animating',
      lastGesture: gestureRecord ?? state.lastGesture,
      resumeAt: resumeStamp ? null : state.resumeAt
    });

    const updated = get();
    persistState(updated.game, {
      pendingCommands: updated.pendingCommands,
      orientation: updated.orientation,
      lastVisibleAt: updated.lastVisibleAt
    });
  },
  completeAnimation() {
    const state = get();
    const [nextEntry, ...rest] = state.pendingCommands;
    const settledBoard = settleBoard(state.game.board);
    const targetStatus = state.game.status === 'gameOver' ? 'gameOver' : 'idle';
    const baseGame: GameState = {
      ...state.game,
      board: settledBoard,
      status: targetStatus,
      pendingMoves: targetStatus === 'gameOver' ? [] : rest.map((entry) => entry.command)
    };

    if (!nextEntry || targetStatus === 'gameOver') {
      set({
        game: baseGame,
        events: [],
        pendingCommands: targetStatus === 'gameOver' ? [] : rest,
        isAnimating: false
      });
      return;
    }

    const resumeStamp = nextEntry.metadata?.resumeAt ?? state.resumeAt ?? null;
    const telemetryMetadata =
      nextEntry.metadata || resumeStamp ? { ...nextEntry.metadata, resumeAt: resumeStamp ?? undefined } : undefined;
    const result = resolveMoveResult(baseGame, nextEntry.command);
    const telemetry = enrichTelemetryPayloads(result.telemetry, telemetryMetadata, state.orientation, resumeStamp);
    const primaryTelemetry = telemetry[0];
    const latency = nextEntry.metadata?.latencyMs ?? (primaryTelemetry ? primaryTelemetry.latencyMs : 0);
    const gestureRecord =
      nextEntry.metadata?.gestureType && Number.isFinite(latency)
        ? {
            type: nextEntry.metadata.gestureType,
            latencyMs: latency,
            completedAt: Date.now()
          }
        : state.lastGesture;

    set({
      game: result.nextState,
      events: result.events,
      pendingTelemetry: [...state.pendingTelemetry, ...telemetry],
      pendingCommands: rest,
      isAnimating: result.nextState.status === 'animating',
      lastGesture: gestureRecord ?? state.lastGesture,
      resumeAt: resumeStamp ? null : state.resumeAt
    });

    const updated = get();
    persistState(updated.game, {
      pendingCommands: updated.pendingCommands,
      orientation: updated.orientation,
      lastVisibleAt: updated.lastVisibleAt
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
    const orientation = detectOrientation();
    persistState(nextState, { pendingCommands: [], orientation, lastVisibleAt: null });
    set({
      game: nextState,
      events: [],
      pendingTelemetry: [],
      pendingCommands: [],
      isAnimating: false,
      lastGesture: null,
      resumeAt: null,
      noMovePromptAt: null,
      lastVisibleAt: null,
      orientation
    });
  },
  hydrate(game) {
    set({
      game,
      events: [],
      pendingTelemetry: [],
      pendingCommands: [],
      isAnimating: false,
      lastGesture: null,
      resumeAt: null,
      noMovePromptAt: null,
      lastVisibleAt: null,
      orientation: detectOrientation()
    });
  },
  setOrientation(orientation) {
    set({ orientation });
  },
  setResumeAt(timestamp) {
    set({ resumeAt: timestamp });
  },
  setNoMovePrompt(timestamp) {
    set({ noMovePromptAt: timestamp });
  },
  setLastVisible(timestamp) {
    set({ lastVisibleAt: timestamp });
  },
  registerTelemetry(payloads) {
    const mobileEvent = payloads.find(
      (payload) => payload.deviceCategory === 'mobile' && payload.event === 'move.completed'
    );
    if (!mobileEvent) {
      return;
    }
    const gestureType = mobileEvent.gestureType === 'tap' ? 'tap' : 'swipe';
    const latency = Number.isFinite(mobileEvent.latencyMs) ? mobileEvent.latencyMs : 0;
    set({
      lastGesture: {
        type: gestureType,
        latencyMs: latency,
        completedAt: Date.now()
      }
    });
  },
  persistSnapshot() {
    const snapshotState = get();
    persistState(snapshotState.game, {
      pendingCommands: snapshotState.pendingCommands,
      orientation: snapshotState.orientation,
      lastVisibleAt: snapshotState.lastVisibleAt
    });
  }
}));
