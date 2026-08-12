/**
 * Deterministic pseudo-randomness.
 *
 * Every quest records the seed it was generated from, so a generation can be
 * replayed exactly — which makes the engine testable and makes bug reports
 * reproducible ("quest #14 came out wrong" is actionable).
 */

export type Rng = {
  (): number;
  int: (min: number, max: number) => number;
  float: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  pickMany: <T>(items: readonly T[], count: number) => T[];
  weighted: <T>(items: readonly T[], weight: (item: T) => number) => T;
  shuffle: <T>(items: readonly T[]) => T[];
  chance: (probability: number) => boolean;
};

/** xmur3 string hash — turns an arbitrary seed string into a 32-bit integer. */
export function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 — small, fast, good enough distribution for content generation. */
export function createRng(seed: string | number): Rng {
  let state = typeof seed === "string" ? hashSeed(seed) : seed >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng = next as Rng;

  rng.float = (min, max) => min + next() * (max - min);
  rng.int = (min, max) => Math.floor(rng.float(min, max + 1));
  rng.chance = (probability) => next() < probability;

  rng.pick = <T,>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error("rng.pick called with an empty list");
    return items[Math.floor(next() * items.length)]!;
  };

  rng.shuffle = <T,>(items: readonly T[]): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    }
    return copy;
  };

  rng.pickMany = <T,>(items: readonly T[], count: number): T[] =>
    rng.shuffle(items).slice(0, Math.max(0, Math.min(count, items.length)));

  rng.weighted = <T,>(items: readonly T[], weight: (item: T) => number): T => {
    if (items.length === 0) throw new Error("rng.weighted called with an empty list");
    const weights = items.map((item) => Math.max(0.0001, weight(item)));
    const total = weights.reduce((sum, w) => sum + w, 0);
    let target = next() * total;
    for (let i = 0; i < items.length; i++) {
      target -= weights[i]!;
      if (target <= 0) return items[i]!;
    }
    return items[items.length - 1]!;
  };

  return rng;
}

/** A short, human-readable seed. Recorded on every generation. */
export function newSeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Deterministic, dependency-free hash used for quest signatures. */
export function stableHash(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0")
  );
}
