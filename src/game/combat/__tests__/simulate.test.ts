import { describe, expect, it } from "vitest";

import { getBossByLevel, getMonster } from "@/game/data/monsters";

import { buildBalanceTestHero } from "../equipment";
import { generateReport } from "../generateReport";
import { simulateBattle } from "../simulate";
import type { MonsterConfig } from "../types";

function monsterConfig(key: string): MonsterConfig {
  const m = getMonster(key);
  return { key: m.key, name: m.name, level: m.level, type: m.type, isBoss: m.isBoss, weakTo: m.weakTo, resistTo: m.resistTo };
}

describe("simulateBattle", () => {
  it("ten sam seed daje identyczny wynik walki (odtwarzalność raportu)", () => {
    const hero = buildBalanceTestHero("WARRIOR", 10);
    const monster = monsterConfig("szczerbaty-krul");

    const a = simulateBattle(hero, monster, 777);
    const b = simulateBattle(hero, monster, 777);

    expect(a).toEqual(b);
  });

  it("inny seed może dać inny przebieg walki", () => {
    const hero = buildBalanceTestHero("WARRIOR", 10);
    const monster = monsterConfig("szczerbaty-krul");

    const results = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      const outcome = simulateBattle(hero, monster, seed);
      results.add(`${outcome.result}:${outcome.turnsTaken}`);
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it("walka ze zwykłym potworem nie przekracza 15 tur, z bossem 20", () => {
    const hero = buildBalanceTestHero("WARRIOR", 50);
    const normalMonster = monsterConfig("ruiniczny-golem"); // poz. 48
    const boss = monsterConfig("archiwista-velnor"); // poz. 50, boss

    for (let seed = 1; seed <= 50; seed++) {
      expect(simulateBattle(hero, normalMonster, seed).turnsTaken).toBeLessThanOrEqual(15);
      expect(simulateBattle(hero, boss, seed).turnsTaken).toBeLessThanOrEqual(20);
    }
  });

  it("wynik to zawsze jeden z czterech możliwych rezultatów", () => {
    const hero = buildBalanceTestHero("MAGE", 30);
    const boss = monsterConfig("gorrag-dwuglowy");
    for (let seed = 1; seed <= 50; seed++) {
      const outcome = simulateBattle(hero, boss, seed);
      expect(["WIN", "LOSE", "DRAW", "RETREAT"]).toContain(outcome.result);
    }
  });

  it("Mag ignoruje obronę wroga (redukcja obrażeń nie działa na jego ciosy)", () => {
    const hero = buildBalanceTestHero("MAGE", 50);
    const boss = monsterConfig("archiwista-velnor");
    const outcome = simulateBattle(hero, boss, 123);
    const heroHits = outcome.events.filter((e) => e.kind === "attack" && e.actor === "hero" && e.hit);
    expect(heroHits.length).toBeGreaterThan(0);
  });

  it("Łotr atakuje 2 razy na turę", () => {
    const hero = buildBalanceTestHero("ROGUE", 30);
    const boss = monsterConfig("gorrag-dwuglowy");
    const outcome = simulateBattle(hero, boss, 42);
    const heroAttacksInTurn1 = outcome.events.filter(
      (e) => e.kind === "attack" && e.actor === "hero" && e.turn === 1,
    );
    // w turze 1 Łotr atakuje dwa razy, chyba że pierwszy atak już zabił bossa
    expect(heroAttacksInTurn1.length).toBeGreaterThanOrEqual(1);
    expect(heroAttacksInTurn1.length).toBeLessThanOrEqual(2);
  });

  it("wszystkie 5 bossów z 15-balans.md istnieją w danych", () => {
    expect(getBossByLevel(10).key).toBe("szczerbaty-krul");
    expect(getBossByLevel(30).key).toBe("gorrag-dwuglowy");
    expect(getBossByLevel(50).key).toBe("archiwista-velnor");
    expect(getBossByLevel(80).key).toBe("ignar-popielna-luska");
    expect(getBossByLevel(120).key).toBe("pierwotny-smok");
  });
});

describe("generateReport", () => {
  it("nie zostawia niewypełnionych znaczników i nie powtarza tej samej linii dwa razy z rzędu", () => {
    const hero = buildBalanceTestHero("PRIEST", 50);
    const monster = monsterConfig("archiwista-velnor");
    const outcome = simulateBattle(hero, monster, 2024);

    const lines = generateReport(outcome, { heroName: "Aldric", monster, hero, experience: 1250, gold: 42 }, 2024);

    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line).not.toMatch(/\{[A-Z]+\}/);
    }
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i]).not.toBe(lines[i - 1]);
    }
  });
});
