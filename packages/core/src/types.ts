export type Direction = 'up' | 'down' | 'left' | 'right';
export type InputSource = 'keyboard' | 'touch' | 'assistive' | 'tap';
export type DeviceCategory = 'mobile' | 'desktop';
export type GestureType = 'swipe' | 'tap';
export type Orientation = 'portrait' | 'landscape';
export type EngineStatus = 'idle' | 'animating' | 'gameOver';

export interface Tile {
  id: string;
  value: number;
  row: number;
  col: number;
  mergedFrom?: [string, string];
  isNew: boolean;
}

export type BoardMatrix = (Tile | null)[][];

export interface MoveCommand {
  direction: Direction;
  requestedAt: number;
  source: InputSource;
}

export interface GameState {
  board: BoardMatrix;
  score: number;
  bestScore: number;
  moveCount: number;
  seed: string;
  seedCursor: number;
  pendingMoves: MoveCommand[];
  undoStack: SessionSnapshot[];
  status: EngineStatus;
  sessionId?: string;
  lastMoveAt?: number;
}

export type EngineEvent =
  | {
      type: 'TileMoved';
      id: string;
      from: { row: number; col: number };
      to: { row: number; col: number };
    }
  | {
      type: 'TileMerged';
      targetId: string;
      consumedIds: [string, string];
      value: number;
      scoreDelta: number;
    }
  | {
      type: 'TileSpawned';
      id: string;
      value: number;
      position: { row: number; col: number };
    }
  | {
      type: 'MoveRejected';
      reason: string;
    }
  | {
      type: 'GameOver';
      boardHash: string;
    };

export interface SessionSnapshot {
  state: GameState;
  timestamp: number;
  rngCursor: number;
  pendingCommands?: MoveCommand[];
  gestureQueue?: MoveCommand[];
  lastVisibleAt?: number;
  orientation?: Orientation;
}

export interface TelemetryPlatform {
  userAgent: string;
  inputMode: InputSource;
}

export interface TelemetryPayload {
  sessionId: string;
  moveId: string;
  direction: Direction;
  scoreDelta: number;
  boardHash: string;
  latencyMs: number;
  seed: string;
  seedCursor: number;
  platform: TelemetryPlatform;
  timestamp: string;
  event: 'move.completed' | 'move.rejected' | 'game.over';
  deviceCategory?: DeviceCategory;
  gestureType?: GestureType;
  orientation?: Orientation;
  resumeAt?: number;
}

export interface ApplyMoveContext {
  command: MoveCommand;
  platform: TelemetryPlatform;
  now?: number;
  sessionId?: string;
}

export interface ApplyMoveResult {
  nextState: GameState;
  events: EngineEvent[];
  telemetry: TelemetryPayload[];
}
