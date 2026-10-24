import { describe, expect, it } from "vitest";

import { createRng, randomInt, randomRange, rollChance } from "../rng";

describe("createRng", () => {
  it("ten sam seed daje tę samą sekwencję (walkę da się odtworzyć)", () => {
    const a = createRng(12345);
    const b = createRng(12345);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("różne seedy dają różne sekwencje", () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it("zwraca liczby z przedziału [0, 1)", () => {
    const rng = createRng(999);
    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("randomRange / randomInt / rollChance", () => {
  it("randomRange zwraca wartości w podanym przedziale", () => {
    const rng = createRng(42);
    for (let i = 0; i < 500; i++) {
      const value = randomRange(rng, 0.85, 1.15);
      expect(value).toBeGreaterThanOrEqual(0.85);
      expect(value).toBeLessThan(1.15);
    }
  });

  it("randomInt zwraca wartości całkowite w [min, max]", () => {
    const rng = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const value = randomInt(rng, 1, 10);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(10);
      seen.add(value);
    }
    expect(seen.size).toBe(10);
  });

  it("rollChance(…, 0) nigdy nie trafia, rollChance(…, 1) trafia zawsze", () => {
    const rng = createRng(55);
    for (let i = 0; i < 100; i++) {
      expect(rollChance(rng, 0)).toBe(false);
      expect(rollChance(rng, 1)).toBe(true);
    }
  });
});
