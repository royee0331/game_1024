import type { BoardMatrix } from '@core/types';

function toHex(value: number): string {
  return value.toString(16).padStart(2, '0');
}

export function formatBoardHash(board: BoardMatrix): string {
  const flatValues: number[] = [];
  for (const row of board) {
    for (const cell of row) {
      flatValues.push(cell?.value ?? 0);
    }
  }

  let hash = 0;
  for (const value of flatValues) {
    hash = (hash * 31 + value) >>> 0;
  }

  const encoded = flatValues.map((value) => toHex(value)).join('');
  return `b${encoded}-${hash.toString(16)}`;
}

export function formatScore(score: number): string {
  return score.toLocaleString('en-US');
}

export function formatScoreDelta(delta: number): string {
  const formatted = Math.abs(delta).toLocaleString('en-US');
  return delta >= 0 ? `+${formatted}` : `-${formatted}`;
}
