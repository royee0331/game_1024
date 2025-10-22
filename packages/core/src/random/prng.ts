export interface PrngSnapshot {
  seed: string;
  cursor: number;
}

export interface TranscriptEntry {
  cursor: number;
  value: number;
}

export interface SeededPrng {
  readonly seed: string;
  readonly transcript: TranscriptEntry[];
  cursor: number;
  next(): number;
  nextInt(maxExclusive: number): number;
  fork(cursor?: number): SeededPrng;
  toSnapshot(): PrngSnapshot;
}

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function seed() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a: number): () => number {
  return function random() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createRandomFn(seed: string, cursor: number): { rand: () => number; skip: (count: number) => void } {
  const seedFn = xmur3(seed);
  const base = seedFn();
  const rand = mulberry32(base + cursor);
  return {
    rand,
    skip(count: number) {
      for (let i = 0; i < count; i += 1) {
        rand();
      }
    }
  };
}

export function createSeededPrng(seed: string, cursor = 0): SeededPrng {
  const transcript: TranscriptEntry[] = [];
  let currentCursor = cursor;
  let { rand } = createRandomFn(seed, 0);

  const prng: SeededPrng = {
    seed,
    transcript,
    get cursor() {
      return currentCursor;
    },
    set cursor(value: number) {
      currentCursor = value;
      const context = createRandomFn(seed, 0);
      rand = context.rand;
      context.skip(value);
    },
    next() {
      const value = rand();
      transcript.push({ cursor: currentCursor, value });
      currentCursor += 1;
      return value;
    },
    nextInt(maxExclusive: number) {
      if (maxExclusive <= 0) {
        throw new Error('maxExclusive must be > 0');
      }
      return Math.floor(prng.next() * maxExclusive);
    },
    fork(newCursor?: number) {
      return createSeededPrng(seed, newCursor ?? currentCursor);
    },
    toSnapshot() {
      return { seed, cursor: currentCursor };
    }
  };

  if (cursor > 0) {
    const context = createRandomFn(seed, 0);
    rand = context.rand;
    context.skip(cursor);
  }

  return prng;
}
