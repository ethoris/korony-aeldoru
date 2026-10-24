import { describe, expect, it } from "vitest";

import { BUILDINGS } from "@/game/data/buildings";

import {
  buildingCost,
  buildingTimeMinutes,
  manaPerHour,
  marketTaxPercent,
  productionPerHour,
  raidProtectionPercent,
  vaultCapacity,
  warehouseCapacity,
} from "../formulas";

describe("fortress formulas", () => {
  it("produkcja na godzinę zgadza się z tabelą GDD", () => {
    expect(productionPerHour(1)).toBeCloseTo(30, 0);
    expect(productionPerHour(5)).toBeCloseTo(207, 0);
    expect(productionPerHour(10)).toBeCloseTo(475, 0);
    expect(productionPerHour(15)).toBeCloseTo(773, 0);
    expect(productionPerHour(20)).toBeCloseTo(1092, 0);
  });

  it("mana to 20% produkcji zwykłego budynku tego poziomu", () => {
    expect(manaPerHour(10)).toBeCloseTo(productionPerHour(10) * 0.2);
  });

  it("pojemność magazynu zgadza się z tabelą GDD (zaokrągloną do 100)", () => {
    const table: [number, number][] = [
      [1, 2500],
      [5, 17800],
      [10, 48400],
      [15, 88100],
      [20, 135200],
    ];
    for (const [level, expected] of table) {
      expect(Math.abs(warehouseCapacity(level) - expected)).toBeLessThan(50);
    }
  });

  it("skarbiec mieści 10x pojemność magazynu", () => {
    expect(vaultCapacity(10)).toBeCloseTo(warehouseCapacity(10) * 10);
  });

  it("ochrona przed rabunkiem zgadza się z tabelą GDD", () => {
    expect(raidProtectionPercent(1)).toBe(12);
    expect(raidProtectionPercent(5)).toBe(20);
    expect(raidProtectionPercent(10)).toBe(30);
    expect(raidProtectionPercent(15)).toBe(40);
    expect(raidProtectionPercent(20)).toBe(50);
  });

  it("koszt rośnie ×1,3 na poziom, Krasnoludy płacą 15% mniej", () => {
    const ratusz = BUILDINGS.RATUSZ;
    const costLvl1 = buildingCost(ratusz, 1, false);
    expect(costLvl1).toEqual({ wood: 120, stone: 120, iron: 40, gold: 50 });

    const costLvl10 = buildingCost(ratusz, 10, false);
    expect(costLvl10.wood).toBe(Math.round(120 * Math.pow(1.3, 9)));

    const dwarfLvl1 = buildingCost(ratusz, 1, true);
    expect(dwarfLvl1.wood).toBe(Math.round(120 * 0.85));
  });

  it("przykład z GDD: Ratusz na poziom 10 kosztuje 1273/1273/424/530 i buduje się 1,2 h", () => {
    const ratusz = BUILDINGS.RATUSZ;
    const cost = buildingCost(ratusz, 10, false);
    expect(cost).toEqual({ wood: 1273, stone: 1273, iron: 424, gold: 530 });

    const minutes = buildingTimeMinutes(ratusz, 10, false);
    expect(minutes / 60).toBeCloseTo(1.2, 1);
  });

  it("czas rośnie ×1,25 na poziom, Krasnoludy czekają 15% krócej", () => {
    const tartak = BUILDINGS.TARTAK;
    expect(buildingTimeMinutes(tartak, 1, false)).toBe(3);
    expect(buildingTimeMinutes(tartak, 1, true)).toBeCloseTo(3 * 0.85);
    expect(buildingTimeMinutes(tartak, 20, false) / 60).toBeCloseTo(3.5, 1);
  });

  it("podatek targowiska: 5% bazowo, 4% od poz.10, 3% od poz.20", () => {
    expect(marketTaxPercent(1)).toBe(5);
    expect(marketTaxPercent(9)).toBe(5);
    expect(marketTaxPercent(10)).toBe(4);
    expect(marketTaxPercent(19)).toBe(4);
    expect(marketTaxPercent(20)).toBe(3);
  });
});
