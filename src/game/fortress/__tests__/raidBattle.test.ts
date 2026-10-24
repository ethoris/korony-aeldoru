import { describe, expect, it } from "vitest";

import { attackerPower, carryCapacity, defenderPower, dominantUnitType, resolveRaidBattle } from "../raidBattle";

describe("raidBattle", () => {
  it("dominantUnitType zwraca typ z największą liczbą", () => {
    expect(dominantUnitType({ WLOCZNIK: 10, LUCZNIK: 3 })).toBe("WLOCZNIK");
    expect(dominantUnitType({})).toBeNull();
  });

  it("atak dostaje +50% przy przewadze typu nad dominującym typem obrońcy", () => {
    // Łucznik ma advantageOver WLOCZNIK
    const withAdvantage = attackerPower({ LUCZNIK: 10 }, { WLOCZNIK: 100 });
    const withoutAdvantage = attackerPower({ LUCZNIK: 10 }, { RYCERZ: 100 });
    expect(withAdvantage).toBeCloseTo(withoutAdvantage * 1.5);
  });

  it("obrona rośnie z poziomem Murów (+5% na poziom)", () => {
    const base = defenderPower({ WLOCZNIK: 10 }, 0);
    const withWalls = defenderPower({ WLOCZNIK: 10 }, 10);
    expect(withWalls).toBeCloseTo(base * 1.5);
  });

  it("ładowność sumuje się z wysłanej armii", () => {
    expect(carryCapacity({ WLOCZNIK: 5, RYCERZ: 2 })).toBe(5 * 20 + 2 * 40);
  });

  it("silniejszy atakujący wygrywa, przegrany traci 100%, zwycięzca traci wg wzoru przewagi", () => {
    const result = resolveRaidBattle({ RYCERZ: 100 }, { WLOCZNIK: 10 }, 0, 1, 1);
    expect(result.attackerWins).toBe(true);
    expect(result.loserLossFraction).toBe(1);
    expect(result.winnerLossFraction).toBeGreaterThanOrEqual(0);
    expect(result.winnerLossFraction).toBeLessThan(1);
  });

  it("przewaga 2:1 daje stratę zwycięzcy ~35% (przykład z GDD)", () => {
    // WLOCZNIK atak=8, brak przewagi typu vs WLOCZNIK → attackerPower = 8×25 = 200
    // WLOCZNIK obrona=12, mury=0 → defenderPower = 12×(100/12) = 100 → ratio 2:1
    const result = resolveRaidBattle({ WLOCZNIK: 25 }, { WLOCZNIK: 100 / 12 }, 0, 1, 1);
    expect(result.attackerWins).toBe(true);
    expect(result.winnerLossFraction).toBeCloseTo(0.3536, 3);
  });
});
