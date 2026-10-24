import type { BuildingCost, BuildingDefinition } from "@/game/data/buildings";

/** Produkcja na godzinę = 30 · poziom^1,2 (docs/gdd/09-twierdza-i-wojna.md). */
export function productionPerHour(level: number): number {
  if (level <= 0) return 0;
  return 30 * Math.pow(level, 1.2);
}

/** Mana z Wieży Magów = 20% produkcji zwykłego budynku tego poziomu. */
export function manaPerHour(level: number): number {
  return productionPerHour(level) * 0.2;
}

/** Pojemność magazynu = 1000 + 1500 · poziom^1,5 (bazowe 1000 nawet bez Magazynu). */
export function warehouseCapacity(level: number): number {
  return 1000 + 1500 * Math.pow(Math.max(0, level), 1.5);
}

/** Skarbiec mieści 10× pojemność magazynu. */
export function vaultCapacity(magazynLevel: number): number {
  return warehouseCapacity(magazynLevel) * 10;
}

/**
 * Ochrona przed rabunkiem w %, zależna od poziomu Magazynu. Formuła nie jest
 * podana wprost w GDD, ale dokładnie odtwarza tabelę z 5 punktami (1→12%,
 * 5→20%, 10→30%, 15→40%, 20→50%) liniową interpolacją: 12 + 2·(poziom−1).
 */
export function raidProtectionPercent(magazynLevel: number): number {
  if (magazynLevel <= 0) return 0;
  return 12 + 2 * (magazynLevel - 1);
}

/** koszt(p) = koszt bazowy · 1,3^(p−1); Krasnoludy płacą 15% mniej. */
export function buildingCost(def: BuildingDefinition, targetLevel: number, isDwarf: boolean): BuildingCost {
  const multiplier = Math.pow(1.3, targetLevel - 1) * (isDwarf ? 0.85 : 1);
  return {
    wood: Math.round(def.baseCost.wood * multiplier),
    stone: Math.round(def.baseCost.stone * multiplier),
    iron: Math.round(def.baseCost.iron * multiplier),
    gold: Math.round(def.baseCost.gold * multiplier),
  };
}

/** czas(p) = czas bazowy · 1,25^(p−1) w minutach; Krasnoludy czekają 15% krócej. */
export function buildingTimeMinutes(def: BuildingDefinition, targetLevel: number, isDwarf: boolean): number {
  const multiplier = Math.pow(1.25, targetLevel - 1) * (isDwarf ? 0.85 : 1);
  return def.baseTimeMinutes * multiplier;
}
