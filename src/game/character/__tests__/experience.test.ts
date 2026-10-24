import { describe, expect, it } from "vitest";

import { experienceToNextLevel, totalFreePointsEarned } from "../experience";

describe("experienceToNextLevel", () => {
  it("odpowiada przykładom z docs/gdd/00-glowny.md", () => {
    expect(experienceToNextLevel(1)).toBe(34);
    expect(experienceToNextLevel(10)).toBeCloseTo(1700, -2);
    expect(experienceToNextLevel(50)).toBeCloseTo(26300, -3);
    expect(experienceToNextLevel(119)).toBeCloseTo(114800, -3);
  });
});

describe("totalFreePointsEarned", () => {
  it("na poziomie 1 nikt nie ma jeszcze punktów", () => {
    expect(totalFreePointsEarned(1, "ELF")).toBe(0);
    expect(totalFreePointsEarned(1, "HUMAN")).toBe(0);
  });

  it("3 punkty na poziom dla ras bez bonusu", () => {
    expect(totalFreePointsEarned(21, "ELF")).toBe(60);
  });

  it("Człowiek dostaje +1 co 5 poziomów", () => {
    expect(totalFreePointsEarned(5, "HUMAN")).toBe(3 * 4 + 1);
    expect(totalFreePointsEarned(10, "HUMAN")).toBe(3 * 9 + 2);
  });
});
