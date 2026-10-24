import { describe, expect, it } from "vitest";

import { buildBalanceTestHero } from "../equipment";
import { simulatePvpDuel } from "../duel";

describe("simulatePvpDuel", () => {
  it("ten sam seed daje identyczny wynik (odtwarzalność)", () => {
    const a1 = buildBalanceTestHero("WARRIOR", 20);
    const b1 = buildBalanceTestHero("MAGE", 20);

    const outcome1 = simulatePvpDuel(a1, b1, 123);
    const outcome2 = simulatePvpDuel(a1, b1, 123);

    expect(outcome1).toEqual(outcome2);
  });

  it("silniejszy atakujący (dużo wyższy poziom) zwykle wygrywa", () => {
    const strong = buildBalanceTestHero("WARRIOR", 80);
    const weak = buildBalanceTestHero("WARRIOR", 20);

    let wins = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const outcome = simulatePvpDuel(strong, weak, seed);
      if (outcome.result === "WIN") wins++;
    }
    expect(wins).toBeGreaterThan(15);
  });

  it("nie przekracza limitu 15 tur (pojedynek nie jest walką z bossem)", () => {
    const a = buildBalanceTestHero("PALADIN", 50);
    const b = buildBalanceTestHero("PALADIN", 50);
    for (let seed = 1; seed <= 10; seed++) {
      const outcome = simulatePvpDuel(a, b, seed);
      expect(outcome.turnsTaken).toBeLessThanOrEqual(15);
    }
  });

  it("wynik to WIN, LOSE albo DRAW (remis po limicie tur)", () => {
    const a = buildBalanceTestHero("ROGUE", 30);
    const b = buildBalanceTestHero("ROGUE", 30);
    for (let seed = 1; seed <= 15; seed++) {
      const outcome = simulatePvpDuel(a, b, seed);
      expect(["WIN", "LOSE", "DRAW"]).toContain(outcome.result);
    }
  });
});
