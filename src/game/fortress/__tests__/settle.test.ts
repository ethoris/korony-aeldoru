import { describe, expect, it } from "vitest";

import type { BuildingKey } from "@/game/data/buildings";
import { BUILDING_KEYS } from "@/game/data/buildings";

import { productionPerHour, warehouseCapacity } from "../formulas";
import { settleFortress } from "../settle";
import type { BuildingLevels, Resources } from "../settle";

function emptyLevels(overrides: Partial<BuildingLevels> = {}): BuildingLevels {
  const levels = {} as BuildingLevels;
  for (const key of BUILDING_KEYS) levels[key] = 0;
  return { ...levels, ...overrides };
}

function emptyResources(overrides: Partial<Resources> = {}): Resources {
  return { wood: 0, stone: 0, iron: 0, food: 0, mana: 0, ...overrides };
}

describe("settleFortress", () => {
  it("dolicza produkcję za upływ czasu bez kolejki", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-01-01T02:00:00Z");

    const result = settleFortress(
      { buildingLevels: emptyLevels({ TARTAK: 5, MAGAZYN: 5 }), resources: emptyResources(), lastProductionAt: start },
      [],
      now,
    );

    expect(result.resources.wood).toBeCloseTo(productionPerHour(5) * 2);
    expect(result.lastProductionAt).toEqual(now);
  });

  it("nie przekracza pojemności magazynu", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-01-10T00:00:00Z"); // dużo czasu, produkcja powinna się zapełnić

    const result = settleFortress(
      {
        buildingLevels: emptyLevels({ TARTAK: 10, MAGAZYN: 1 }),
        resources: emptyResources(),
        lastProductionAt: start,
      },
      [],
      now,
    );

    expect(result.resources.wood).toBeCloseTo(warehouseCapacity(1));
  });

  it("stosuje zakończone wpisy kolejki i podnosi poziom budynku", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const buildEnd = new Date("2026-01-01T01:00:00Z");
    const now = new Date("2026-01-01T02:00:00Z");

    const result = settleFortress(
      { buildingLevels: emptyLevels({ RATUSZ: 1 }), resources: emptyResources(), lastProductionAt: start },
      [{ id: "q1", building: "TARTAK" as BuildingKey, targetLevel: 1, endAt: buildEnd }],
      now,
    );

    expect(result.buildingLevels.TARTAK).toBe(1);
    expect(result.completed).toHaveLength(1);
    expect(result.remainingQueue).toHaveLength(0);
    // godzina 0: TARTAK poziom 0 (brak produkcji); godzina 1: TARTAK poziom 1
    expect(result.resources.wood).toBeCloseTo(productionPerHour(1) * 1);
  });

  it("zostawia niezakończone wpisy w remainingQueue", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const notYet = new Date("2026-01-02T00:00:00Z");
    const now = new Date("2026-01-01T00:30:00Z");

    const result = settleFortress(
      { buildingLevels: emptyLevels(), resources: emptyResources(), lastProductionAt: start },
      [{ id: "q1", building: "TARTAK" as BuildingKey, targetLevel: 1, endAt: notYet }],
      now,
    );

    expect(result.completed).toHaveLength(0);
    expect(result.remainingQueue).toHaveLength(1);
    expect(result.buildingLevels.TARTAK).toBe(0);
  });
});
