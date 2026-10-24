import { describe, expect, it } from "vitest";

import { computeDerivedStats } from "../derivedStats";

describe("computeDerivedStats", () => {
  it("liczy PŻ i obronę bez ekwipunku ze wzorów walki", () => {
    const stats = { strength: 10, dexterity: 10, vitality: 20, intellect: 10 };
    const derived = computeDerivedStats(stats, 1);

    expect(derived.maxHp).toBe(50 + 12 * 20 + 8 * 1);
    expect(derived.defenseNoGear).toBe(10); // 0 pancerza + WYT/2
  });

  it("krytyk startuje od 5% przy ZRE 10", () => {
    const stats = { strength: 10, dexterity: 10, vitality: 10, intellect: 10 };
    expect(computeDerivedStats(stats, 10).critChancePct).toBeCloseTo(5, 5);
  });
});
