/**
 * Deterministyczny generator liczb losowych (mulberry32) – ten sam seed
 * zawsze daje ten sam przebieg walki, więc raport da się odtworzyć.
 */
export type Rng = () => number;

export function createRng(seed: number): Rng {
  let state = (seed >>> 0) || 1;
  return function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Losowa liczba zmiennoprzecinkowa z przedziału [min, max]. */
export function randomRange(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** Losowa liczba całkowita z przedziału [min, max] (włącznie). */
export function randomInt(rng: Rng, min: number, max: number): number {
  return Math.floor(randomRange(rng, min, max + 1));
}

/** Rzut procentowy: true z szansą `chance` (0–1). */
export function rollChance(rng: Rng, chance: number): boolean {
  return rng() < chance;
}

/** Losuje element tablicy, bez powtórzenia tego samego indeksu co ostatnio (gdy to możliwe). */
export function pickWithoutImmediateRepeat<T>(rng: Rng, items: readonly T[], lastIndex: number): { value: T; index: number } {
  if (items.length === 1) {
    return { value: items[0], index: 0 };
  }
  let index = Math.floor(rng() * items.length);
  if (index === lastIndex) {
    index = (index + 1) % items.length;
  }
  return { value: items[index], index };
}
