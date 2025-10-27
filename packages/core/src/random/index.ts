import { createSeededPrng } from './prng';
import type { PrngSnapshot, SeededPrng } from './prng';

export type { SeededPrng, PrngSnapshot, TranscriptEntry } from './prng';
export { createSeededPrng } from './prng';

export function restoreSeededPrng(snapshot: PrngSnapshot): SeededPrng {
  return createSeededPrng(snapshot.seed, snapshot.cursor);
}

export function advanceSeedCursor(snapshot: PrngSnapshot, steps: number): PrngSnapshot {
  if (steps < 0 || !Number.isFinite(steps)) {
    throw new Error('steps must be a non-negative finite number');
  }
  if (steps === 0) {
    return snapshot;
  }
  return {
    seed: snapshot.seed,
    cursor: snapshot.cursor + Math.trunc(steps)
  };
}

export function forkWithAdvance(prng: SeededPrng, steps: number): SeededPrng {
  if (steps < 0 || !Number.isFinite(steps)) {
    throw new Error('steps must be a non-negative finite number');
  }
  if (steps === 0) {
    return prng.fork(prng.cursor);
  }
  return prng.fork(prng.cursor + Math.trunc(steps));
}
