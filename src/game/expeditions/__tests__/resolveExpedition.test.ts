import { describe, expect, it } from "vitest";

import { getLocation } from "@/game/data/locations";
import { getMonster } from "@/game/data/monsters";

import { resolveExpedition } from "../resolveExpedition";

const baseParams = {
  classKey: "WARRIOR" as const,
  level: 10,
  stats: { strength: 30, dexterity: 10, vitality: 20, intellect: 10 },
  tactic: "BALANCED" as const,
  startingGoldPouch: 100,
  fightsSinceRareDrop: 0,
};

describe("resolveExpedition", () => {
  it("ten sam seed daje identyczny wynik", () => {
    const location = getLocation("goblinia-nora");
    const a = resolveExpedition({ ...baseParams, location, kind: "HUNT", seed: 42 });
    const b = resolveExpedition({ ...baseParams, location, kind: "HUNT", seed: 42 });
    expect(a).toEqual(b);
  });

  it("Zwiad i Polowanie to zawsze 1 walka", () => {
    const location = getLocation("goblinia-nora");
    for (let seed = 1; seed <= 20; seed++) {
      expect(resolveExpedition({ ...baseParams, location, kind: "SCOUT", seed }).fights.length).toBe(1);
      expect(resolveExpedition({ ...baseParams, location, kind: "HUNT", seed }).fights.length).toBe(1);
    }
  });

  it("Głęboka wyprawa to 2–3 walki pod rząd, przerwane pierwszą nie-wygraną", () => {
    const location = getLocation("goblinia-nora");
    for (let seed = 1; seed <= 100; seed++) {
      const resolution = resolveExpedition({ ...baseParams, location, kind: "DEEP", seed });
      expect(resolution.fights.length).toBeGreaterThanOrEqual(1);
      expect(resolution.fights.length).toBeLessThanOrEqual(3);

      const nonFinalFights = resolution.fights.slice(0, -1);
      expect(nonFinalFights.every((f) => f.battle.result === "WIN")).toBe(true);
    }
  });

  it("boss zawsze walczy z bossem lokacji i gwarantuje rzadki+ łup przy wygranej", () => {
    const location = getLocation("goblinia-nora");
    for (let seed = 1; seed <= 100; seed++) {
      const resolution = resolveExpedition({ ...baseParams, location, kind: "BOSS", seed });
      expect(resolution.fights.length).toBe(1);
      expect(resolution.fights[0].monsterKey).toBe("szczerbaty-krul");
      if (resolution.fights[0].battle.result === "WIN") {
        expect(resolution.fights[0].lootItem).not.toBeNull();
        expect(["RARE", "LEGENDARY"]).toContain(resolution.fights[0].lootItem!.quality);
      }
    }
  });

  it("przegrana zabiera 5% złota przy sobie i rani na 15 minut (30 z bossem)", () => {
    const location = getLocation("goblinia-nora");
    let foundNormalLoss = false;
    let foundBossLoss = false;

    for (let seed = 1; seed <= 500 && !(foundNormalLoss && foundBossLoss); seed++) {
      const normal = resolveExpedition({ ...baseParams, level: 1, stats: { strength: 10, dexterity: 10, vitality: 10, intellect: 10 }, location, kind: "HUNT", seed });
      if (normal.overallResult === "LOSE") {
        foundNormalLoss = true;
        expect(normal.injuredMinutes).toBe(15);
        expect(normal.totalGoldDelta).toBeLessThan(0);
      }

      const boss = resolveExpedition({ ...baseParams, level: 1, stats: { strength: 10, dexterity: 10, vitality: 10, intellect: 10 }, location, kind: "BOSS", seed });
      if (boss.overallResult === "LOSE") {
        foundBossLoss = true;
        expect(boss.injuredMinutes).toBe(30);
      }
    }

    expect(foundNormalLoss).toBe(true);
    expect(foundBossLoss).toBe(true);
  });

  it("wygrana daje pełne PD, przegrana 30%, remis/odwrót 50%", () => {
    const location = getLocation("goblinia-nora");

    for (let seed = 1; seed <= 300; seed++) {
      const resolution = resolveExpedition({
        ...baseParams,
        level: 1,
        stats: { strength: 10, dexterity: 10, vitality: 10, intellect: 10 },
        location,
        kind: "HUNT",
        seed,
      });
      const fight = resolution.fights[0];
      const monsterLevel = getMonster(fight.monsterKey).level;
      const fullXp = 25 * monsterLevel;

      if (fight.battle.result === "WIN") {
        expect(fight.xpGained).toBe(fullXp);
      } else if (fight.battle.result === "LOSE") {
        expect(fight.xpGained).toBe(Math.round(fullXp * 0.3));
      } else {
        expect(fight.xpGained).toBe(Math.round(fullXp * 0.5));
      }
    }
  });
});
