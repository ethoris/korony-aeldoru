import { describe, expect, it } from "vitest";

import { createRng } from "@/game/combat/rng";
import { EXPEDITION_KINDS } from "@/game/data/expeditionKinds";

import { generateLoot } from "../generateItem";

describe("generateLoot", () => {
  it("ten sam seed daje identyczny łup", () => {
    const a = generateLoot({ rng: createRng(123), monsterLevel: 10, playerClass: "WARRIOR", kind: EXPEDITION_KINDS.HUNT });
    const b = generateLoot({ rng: createRng(123), monsterLevel: 10, playerClass: "WARRIOR", kind: EXPEDITION_KINDS.HUNT });
    expect(a).toEqual(b);
  });

  it("czasem nie daje przedmiotu (mikstura albo brak łupu)", () => {
    let nullCount = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const item = generateLoot({ rng: createRng(seed), monsterLevel: 10, playerClass: "WARRIOR", kind: EXPEDITION_KINDS.HUNT });
      if (item === null) nullCount++;
    }
    expect(nullCount).toBeGreaterThan(0);
  });

  it("Zwiad nigdy nie daje rzadkich/legendarnych przedmiotów", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const item = generateLoot({ rng: createRng(seed), monsterLevel: 10, playerClass: "WARRIOR", kind: EXPEDITION_KINDS.SCOUT });
      if (item) {
        expect(["COMMON", "MAGIC"]).toContain(item.quality);
      }
    }
  });

  it("broń ma damageMin <= damageMax", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const item = generateLoot({ rng: createRng(seed), monsterLevel: 50, playerClass: "MAGE", kind: EXPEDITION_KINDS.HUNT });
      if (item?.slot === "WEAPON") {
        expect(item.damageMin!).toBeLessThanOrEqual(item.damageMax!);
      }
    }
  });

  it("poziom przedmiotu jest w zakresie poziom potwora ±2, maks. 100", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const item = generateLoot({ rng: createRng(seed), monsterLevel: 99, playerClass: "ROGUE", kind: EXPEDITION_KINDS.DEEP });
      if (item) {
        expect(item.level).toBeGreaterThanOrEqual(97);
        expect(item.level).toBeLessThanOrEqual(100);
      }
    }
  });

  it("guaranteedMinQuality wymusza minimalną jakość (bossowie)", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const item = generateLoot({
        rng: createRng(seed),
        monsterLevel: 10,
        playerClass: "WARRIOR",
        kind: EXPEDITION_KINDS.BOSS,
        guaranteedMinQuality: "RARE",
      });
      if (item) {
        expect(["RARE", "LEGENDARY"]).toContain(item.quality);
      }
    }
  });

  it("magiczny przedmiot ma 1 cechę, rzadki 2, legendarny 3", () => {
    const counts: Record<string, number[]> = { MAGIC: [], RARE: [], LEGENDARY: [] };
    for (let seed = 1; seed <= 2000; seed++) {
      const item = generateLoot({ rng: createRng(seed), monsterLevel: 50, playerClass: "PRIEST", kind: EXPEDITION_KINDS.DEEP });
      if (item && item.quality !== "COMMON") {
        counts[item.quality].push(item.affixes.length);
      }
    }
    if (counts.MAGIC.length) expect(counts.MAGIC.every((n) => n === 1)).toBe(true);
    if (counts.RARE.length) expect(counts.RARE.every((n) => n === 2)).toBe(true);
    if (counts.LEGENDARY.length) expect(counts.LEGENDARY.every((n) => n === 3)).toBe(true);
  });
});
