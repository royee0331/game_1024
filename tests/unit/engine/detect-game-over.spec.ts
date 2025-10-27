import { describe, it, expect } from 'vitest';
import { detectGameOver, hasAvailableMoves } from '@core/engine/detectGameOver';
import type { BoardMatrix } from '@core/types';

const emptyBoard: BoardMatrix = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => null));

const stuckBoard: BoardMatrix = [
  [
    { id: 'a', value: 2, row: 0, col: 0, isNew: false },
    { id: 'b', value: 4, row: 0, col: 1, isNew: false },
    { id: 'c', value: 2, row: 0, col: 2, isNew: false },
    { id: 'd', value: 4, row: 0, col: 3, isNew: false }
  ],
  [
    { id: 'e', value: 8, row: 1, col: 0, isNew: false },
    { id: 'f', value: 16, row: 1, col: 1, isNew: false },
    { id: 'g', value: 8, row: 1, col: 2, isNew: false },
    { id: 'h', value: 16, row: 1, col: 3, isNew: false }
  ],
  [
    { id: 'i', value: 2, row: 2, col: 0, isNew: false },
    { id: 'j', value: 4, row: 2, col: 1, isNew: false },
    { id: 'k', value: 2, row: 2, col: 2, isNew: false },
    { id: 'l', value: 4, row: 2, col: 3, isNew: false }
  ],
  [
    { id: 'm', value: 8, row: 3, col: 0, isNew: false },
    { id: 'n', value: 16, row: 3, col: 1, isNew: false },
    { id: 'o', value: 8, row: 3, col: 2, isNew: false },
    { id: 'p', value: 16, row: 3, col: 3, isNew: false }
  ]
];

describe('detectGameOver', () => {
  it('reports available moves when board is not full', () => {
    expect(hasAvailableMoves(emptyBoard)).toBe(true);
    expect(detectGameOver(emptyBoard)).toBe(false);
  });

  it('reports game over when no merges remain', () => {
    expect(hasAvailableMoves(stuckBoard)).toBe(false);
    expect(detectGameOver(stuckBoard)).toBe(true);
  });
});
