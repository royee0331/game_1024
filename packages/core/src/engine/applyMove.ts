import { formatBoardHash } from '@shared/formatters/boardHash';
import type {
  ApplyMoveContext,
  ApplyMoveResult,
  BoardMatrix,
  Direction,
  EngineEvent,
  GameState,
  MoveCommand,
  Tile,
  TelemetryPayload
} from '../types';
import type { SeededPrng } from '../random/prng';
import { detectGameOver } from './detectGameOver';

interface Position {
  row: number;
  col: number;
}

const BOARD_SIZE = 4;

function cloneTile(tile: Tile): Tile {
  return {
    ...tile,
    mergedFrom: undefined,
    isNew: false
  };
}

function cloneBoard(board: BoardMatrix): BoardMatrix {
  return board.map((row) => row.map((cell) => (cell ? cloneTile(cell) : null)));
}

function getLines(size: number, direction: Direction): Position[][] {
  const lines: Position[][] = [];
  for (let index = 0; index < size; index += 1) {
    const positions: Position[] = [];
    if (direction === 'left' || direction === 'right') {
      for (let col = 0; col < size; col += 1) {
        const actualCol = direction === 'left' ? col : size - 1 - col;
        positions.push({ row: index, col: actualCol });
      }
    } else {
      for (let row = 0; row < size; row += 1) {
        const actualRow = direction === 'up' ? row : size - 1 - row;
        positions.push({ row: actualRow, col: index });
      }
    }
    lines.push(positions);
  }
  return lines;
}

function createMoveId(state: GameState, prng: SeededPrng): string {
  return `${state.seed}-${state.moveCount + 1}-${prng.cursor}`;
}

function buildRejectionResult(
  state: GameState,
  command: MoveCommand,
  context: ApplyMoveContext
): ApplyMoveResult {
  const timestamp = context.now ?? Date.now();
  const telemetrySessionId = context.sessionId ?? state.sessionId ?? 'unknown-session';
  const telemetry = [
    {
      sessionId: telemetrySessionId,
      moveId: `${state.seed}-${state.moveCount + 1}-rejected`,
      direction: command.direction,
      scoreDelta: 0,
      boardHash: formatBoardHash(state.board),
      latencyMs: Math.max(0, timestamp - command.requestedAt),
      seed: state.seed,
      seedCursor: state.seedCursor,
      platform: context.platform,
      timestamp: new Date(timestamp).toISOString(),
      event: 'move.rejected' as const
    }
  ];

  const events: EngineEvent[] = [
    {
      type: 'MoveRejected',
      reason: 'Move results in no tile shifts or merges'
    }
  ];

  return {
    nextState: { ...state },
    events,
    telemetry
  };
}

function buildGameOverResult(
  state: GameState,
  command: MoveCommand,
  context: ApplyMoveContext
): ApplyMoveResult {
  const timestamp = context.now ?? Date.now();
  const telemetrySessionId = context.sessionId ?? state.sessionId ?? 'unknown-session';
  const boardHash = formatBoardHash(state.board);
  const latencyMs = Math.max(0, timestamp - command.requestedAt);

  const events: EngineEvent[] = [
    {
      type: 'GameOver',
      boardHash
    }
  ];

  const telemetry: TelemetryPayload[] = [
    {
      sessionId: telemetrySessionId,
      moveId: `${state.seed}-${state.moveCount}-game-over`,
      direction: command.direction,
      scoreDelta: 0,
      boardHash,
      latencyMs,
      seed: state.seed,
      seedCursor: state.seedCursor,
      platform: context.platform,
      timestamp: new Date(timestamp).toISOString(),
      event: 'game.over'
    }
  ];

  const nextState: GameState = {
    ...state,
    status: 'gameOver',
    pendingMoves: [],
    lastMoveAt: timestamp
  };

  return {
    nextState,
    events,
    telemetry
  };
}

function buildSnapshot(state: GameState, timestamp: number): GameState {
  return {
    ...state,
    board: cloneBoard(state.board),
    pendingMoves: [],
    undoStack: [],
    lastMoveAt: timestamp
  };
}

export function applyMove(
  state: GameState,
  prng: SeededPrng,
  context: ApplyMoveContext
): ApplyMoveResult {
  const command = context.command;
  const boardSize = state.board.length || BOARD_SIZE;
  const lines = getLines(boardSize, command.direction);
  const nextBoard: BoardMatrix = Array.from({ length: boardSize }, () =>
    Array.from({ length: boardSize }, () => null)
  );

  const events: EngineEvent[] = [];
  let scoreDelta = 0;
  let moved = false;

  for (const line of lines) {
    const tiles = line
      .map((position) => state.board[position.row][position.col])
      .filter((tile): tile is Tile => Boolean(tile))
      .map((tile) => cloneTile(tile));

    const mergedSlots = new Set<number>();
    let targetIndex = 0;
    let sourceIndex = 0;

    while (sourceIndex < tiles.length && targetIndex < line.length) {
      const tile = tiles[sourceIndex];
      const targetPos = line[targetIndex];
      const occupant = nextBoard[targetPos.row][targetPos.col];

      if (!occupant) {
        if (tile.row !== targetPos.row || tile.col !== targetPos.col) {
          events.push({
            type: 'TileMoved',
            id: tile.id,
            from: { row: tile.row, col: tile.col },
            to: { row: targetPos.row, col: targetPos.col }
          });
          moved = true;
        }
        tile.row = targetPos.row;
        tile.col = targetPos.col;
        nextBoard[targetPos.row][targetPos.col] = tile;
        sourceIndex += 1;
      } else if (!mergedSlots.has(targetIndex) && occupant.value === tile.value) {
        const mergedTile: Tile = {
          id: `merge-${state.moveCount + 1}-${targetPos.row}-${targetPos.col}-${targetIndex}`,
          value: occupant.value * 2,
          row: targetPos.row,
          col: targetPos.col,
          mergedFrom: [occupant.id, tile.id],
          isNew: false
        };

        events.push({
          type: 'TileMerged',
          targetId: mergedTile.id,
          consumedIds: [occupant.id, tile.id],
          value: mergedTile.value,
          scoreDelta: mergedTile.value
        });

        if (tile.row !== targetPos.row || tile.col !== targetPos.col) {
          events.push({
            type: 'TileMoved',
            id: tile.id,
            from: { row: tile.row, col: tile.col },
            to: { row: targetPos.row, col: targetPos.col }
          });
        }

        nextBoard[targetPos.row][targetPos.col] = mergedTile;
        mergedSlots.add(targetIndex);
        scoreDelta += mergedTile.value;
        moved = true;
        sourceIndex += 1;
        targetIndex += 1;
      } else {
        targetIndex += 1;
      }
    }
  }

  if (!moved && scoreDelta === 0) {
    if (detectGameOver(state.board)) {
      return buildGameOverResult(state, command, context);
    }
    return buildRejectionResult(state, command, context);
  }

  const emptyCells: Position[] = [];
  for (let row = 0; row < boardSize; row += 1) {
    for (let col = 0; col < boardSize; col += 1) {
      if (!nextBoard[row][col]) {
        emptyCells.push({ row, col });
      }
    }
  }

  if (emptyCells.length > 0) {
    const spawnIndex = prng.nextInt(emptyCells.length);
    const spawnPosition = emptyCells[spawnIndex];
    const value = prng.next() < 0.1 ? 4 : 2;
    const spawnTile: Tile = {
      id: `spawn-${state.moveCount + 1}-${spawnPosition.row}-${spawnPosition.col}-${prng.cursor}`,
      value,
      row: spawnPosition.row,
      col: spawnPosition.col,
      mergedFrom: undefined,
      isNew: true
    };
    nextBoard[spawnPosition.row][spawnPosition.col] = spawnTile;
    events.push({
      type: 'TileSpawned',
      id: spawnTile.id,
      value: spawnTile.value,
      position: { row: spawnTile.row, col: spawnTile.col }
    });
  }

  const timestamp = context.now ?? Date.now();
  const updatedScore = state.score + scoreDelta;
  const updatedBest = Math.max(state.bestScore, updatedScore);
  const snapshot = buildSnapshot(state, timestamp);

  const nextState: GameState = {
    ...state,
    board: nextBoard,
    score: updatedScore,
    bestScore: updatedBest,
    moveCount: state.moveCount + 1,
    seedCursor: prng.cursor,
    pendingMoves: [],
    undoStack: [
      {
        state: snapshot,
        timestamp,
        rngCursor: state.seedCursor
      }
    ],
    status: 'animating',
    lastMoveAt: timestamp
  };

  const boardHash = formatBoardHash(nextBoard);
  const telemetrySessionId = context.sessionId ?? state.sessionId ?? 'unknown-session';
  const telemetry: TelemetryPayload[] = [
    {
      sessionId: telemetrySessionId,
      moveId: createMoveId(state, prng),
      direction: command.direction,
      scoreDelta,
      boardHash,
      latencyMs: Math.max(0, timestamp - command.requestedAt),
      seed: state.seed,
      seedCursor: prng.cursor,
      platform: context.platform,
      timestamp: new Date(timestamp).toISOString(),
      event: 'move.completed' as const
    }
  ];

  if (detectGameOver(nextBoard)) {
    nextState.status = 'gameOver';
    events.push({
      type: 'GameOver',
      boardHash
    });
    telemetry.push({
      sessionId: telemetrySessionId,
      moveId: `${state.seed}-${nextState.moveCount}-game-over`,
      direction: command.direction,
      scoreDelta: 0,
      boardHash,
      latencyMs: Math.max(0, timestamp - command.requestedAt),
      seed: state.seed,
      seedCursor: prng.cursor,
      platform: context.platform,
      timestamp: new Date(timestamp).toISOString(),
      event: 'game.over'
    });
  }

  return {
    nextState,
    events,
    telemetry
  };
}
