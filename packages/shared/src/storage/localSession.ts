import type { GameState, SessionSnapshot } from '@core/types';

const DEFAULT_SESSION_KEY = 'browser-1024/session';
const DEFAULT_BEST_SCORE_KEY = 'browser-1024/best-score';

interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const memoryStore = new Map<string, string>();

const memoryAdapter: StorageAdapter = {
  getItem(key) {
    return memoryStore.get(key) ?? null;
  },
  setItem(key, value) {
    memoryStore.set(key, value);
  },
  removeItem(key) {
    memoryStore.delete(key);
  }
};

function getLocalStorage(): StorageAdapter {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return memoryAdapter;
  }

  try {
    const key = '__storage_test__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return {
      getItem: (name) => window.localStorage.getItem(name),
      setItem: (name, value) => window.localStorage.setItem(name, value),
      removeItem: (name) => window.localStorage.removeItem(name)
    };
  } catch (error) {
    console.warn('[localSession] Falling back to in-memory storage', error);
    return memoryAdapter;
  }
}

const storage = getLocalStorage();

export function saveSessionSnapshot(snapshot: SessionSnapshot, key = DEFAULT_SESSION_KEY): void {
  const payload = JSON.stringify(snapshot);
  storage.setItem(key, payload);
  storage.setItem(DEFAULT_BEST_SCORE_KEY, JSON.stringify(snapshot.state.bestScore));
}

export function loadSessionSnapshot(key = DEFAULT_SESSION_KEY): SessionSnapshot | null {
  const raw = storage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SessionSnapshot;
    return parsed;
  } catch (error) {
    console.warn('[localSession] Failed to parse session snapshot, clearing', error);
    storage.removeItem(key);
    return null;
  }
}

export function clearSession(key = DEFAULT_SESSION_KEY): void {
  storage.removeItem(key);
}

export function loadBestScore(): number {
  const raw = storage.getItem(DEFAULT_BEST_SCORE_KEY);
  if (!raw) {
    return 0;
  }
  try {
    const value = JSON.parse(raw) as number;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export function hydrateInitialState(baseState: GameState): GameState {
  const snapshot = loadSessionSnapshot();
  if (!snapshot) {
    return baseState;
  }

  const bestScore = Math.max(baseState.bestScore, snapshot.state.bestScore ?? 0);
  return {
    ...snapshot.state,
    seedCursor: snapshot.rngCursor ?? snapshot.state.seedCursor,
    bestScore,
    status: 'idle',
    pendingMoves: []
  };
}
