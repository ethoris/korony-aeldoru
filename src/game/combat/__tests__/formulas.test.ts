import { describe, expect, it } from "vitest";

import {
  attackPower,
  critChance,
  damageReduction,
  dexterityAdvantage,
  elementMultiplier,
  heroDefense,
  heroMaxHp,
  hitChance,
  initiative,
  monsterAttack,
  monsterDefense,
  monsterMaxHp,
  turnLimit,
} from "../formulas";

describe("wzory bohatera (docs/gdd/02-systemy-walki.md)", () => {
  it("PŻ = 50 + 12·WYT + 8·poziom", () => {
    expect(heroMaxHp(10, 1)).toBe(50 + 120 + 8);
    expect(heroMaxHp(40, 50)).toBe(50 + 480 + 400);
  });

  it("Atak = obrażenia broni · (1 + 2S/(S+100))", () => {
    expect(attackPower(100, 0)).toBeCloseTo(100, 5);
    expect(attackPower(100, 100)).toBeCloseTo(200, 5);
  });

  it("Obrona = pancerz + WYT/2", () => {
    expect(heroDefense(50, 20)).toBe(60);
  });

  it("redukcja rośnie z obroną i spada z poziomem atakującego", () => {
    const lowLevelReduction = damageReduction(100, 1);
    const highLevelReduction = damageReduction(100, 100);
    expect(lowLevelReduction).toBeGreaterThan(highLevelReduction);
    expect(damageReduction(0, 10)).toBe(0);
  });

  it("przewaga zręczności jest ograniczona do [-1, 1]", () => {
    expect(dexterityAdvantage(1000, 0, 10, 10)).toBe(1);
    expect(dexterityAdvantage(0, 1000, 10, 10)).toBe(-1);
  });

  it("trafienie jest ograniczone do [50%, 95%]", () => {
    expect(hitChance(1, 100, -1)).toBeGreaterThanOrEqual(0.5);
    expect(hitChance(100, 1, 1)).toBeLessThanOrEqual(0.95);
  });

  it("krytyk jest ograniczony do 15% i zaczyna się od 5%", () => {
    expect(critChance(10, 50)).toBeCloseTo(0.05, 5);
    expect(critChance(10000, 1)).toBeCloseTo(0.15, 5);
  });

  it("inicjatywa = ZRE + rzut", () => {
    expect(initiative(20, 5)).toBe(25);
  });

  it("żywioł: słabość +25%, odporność -40%, neutralnie bez zmian", () => {
    expect(elementMultiplier("fire", ["fire"], [])).toBeCloseTo(1.25, 5);
    expect(elementMultiplier("fire", [], ["fire"])).toBeCloseTo(0.6, 5);
    expect(elementMultiplier("fire", [], [])).toBe(1);
  });

  it("limit tur: 15 zwykłe, 20 z bossem", () => {
    expect(turnLimit(false)).toBe(15);
    expect(turnLimit(true)).toBe(20);
  });
});

describe("wzory potworów (docs/gdd/04-bestiariusz.md) – zgodność z tabelą bossów", () => {
  it("Szczerbaty Krul (poz. 10): PŻ 650, Atak 39, Obrona 13", () => {
    expect(monsterMaxHp(10, true)).toBeCloseTo(650, 0);
    expect(monsterAttack(10, true)).toBeCloseTo(39, 0);
    expect(monsterDefense(10, true)).toBeCloseTo(13, 0);
  });

  it("Gorrag Dwugłowy (poz. 30): PŻ 1750, Atak 96, Obrona 34", () => {
    expect(monsterMaxHp(30, true)).toBeCloseTo(1750, 0);
    expect(monsterAttack(30, true)).toBeCloseTo(96, 0);
    expect(monsterDefense(30, true)).toBeCloseTo(34, 0);
  });

  it("Archiwista Velnor (poz. 50): PŻ 2850, Atak 153, Obrona 55", () => {
    expect(monsterMaxHp(50, true)).toBeCloseTo(2850, 0);
    expect(monsterAttack(50, true)).toBeCloseTo(153, 0);
    expect(monsterDefense(50, true)).toBeCloseTo(55, 0);
  });

  it("Ignar Popielna Łuska (poz. 80): PŻ 4500, Atak 239, Obrona 86", () => {
    expect(monsterMaxHp(80, true)).toBeCloseTo(4500, 0);
    expect(monsterAttack(80, true)).toBeCloseTo(239, 0);
    expect(monsterDefense(80, true)).toBeCloseTo(86, 0);
  });

  it("Pierwotny Smok (poz. 120): PŻ 6700, Atak 354, Obrona 127", () => {
    expect(monsterMaxHp(120, true)).toBeCloseTo(6700, 0);
    expect(monsterAttack(120, true)).toBeCloseTo(354, 0);
    expect(monsterDefense(120, true)).toBeCloseTo(127, 0);
  });
});
