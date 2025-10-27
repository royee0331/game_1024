import type { BoardMatrix } from '../types';

interface Position {
  row: number;
  col: number;
}

function hasMergeableNeighbor(board: BoardMatrix, position: Position): boolean {
  const { row, col } = position;
  const tile = board[row][col];
  if (!tile) {
    return false;
  }

  const size = board.length;
  const neighbors: Position[] = [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 }
  ];

  return neighbors.some(({ row: r, col: c }) => {
    if (r < 0 || c < 0 || r >= size || c >= size) {
      return false;
    }
    const neighbor = board[r][c];
    return Boolean(neighbor && neighbor.value === tile.value);
  });
}

/**
 * Determines whether the supplied board has any legal moves remaining.
 */
export function hasAvailableMoves(board: BoardMatrix): boolean {
  const size = board.length;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const tile = board[row][col];
      if (!tile) {
        return true;
      }
      if (hasMergeableNeighbor(board, { row, col })) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Returns `true` when the board is full and no adjacent merges are possible.
 */
export function detectGameOver(board: BoardMatrix): boolean {
  return !hasAvailableMoves(board);
}
