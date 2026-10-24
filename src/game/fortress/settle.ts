import type { BuildingKey, ResourceKey } from "@/game/data/buildings";
import { BUILDINGS } from "@/game/data/buildings";

import { manaPerHour, productionPerHour, warehouseCapacity } from "./formulas";

export type BuildingLevels = Record<BuildingKey, number>;
export type Resources = Record<ResourceKey, number>;

export interface QueueEntry {
  id: string;
  building: BuildingKey;
  targetLevel: number;
  endAt: Date;
}

export interface FortressState {
  buildingLevels: BuildingLevels;
  resources: Resources;
  lastProductionAt: Date;
}

export interface SettleResult {
  buildingLevels: BuildingLevels;
  resources: Resources;
  lastProductionAt: Date;
  completed: QueueEntry[];
  remainingQueue: QueueEntry[];
}

function accumulateProduction(levels: BuildingLevels, resources: Resources, fromMs: number, toMs: number): void {
  if (toMs <= fromMs) return;
  const hours = (toMs - fromMs) / (60 * 60 * 1000);
  const capacity = warehouseCapacity(levels.MAGAZYN ?? 0);

  for (const def of Object.values(BUILDINGS)) {
    if (!def.producesResource) continue;
    const level = levels[def.key] ?? 0;
    if (level <= 0) continue;
    const perHour = def.producesResource === "mana" ? manaPerHour(level) : productionPerHour(level);
    const resource = def.producesResource;
    resources[resource] = Math.min(capacity, resources[resource] + perHour * hours);
  }
}

/**
 * Rozlicza produkcję surowców i kolejkę budowy od ostatniego rozliczenia do
 * `now`, bez procesów w tle (docs/gdd/13-technika.md: czas liczy się przy
 * wejściu gracza). Kolejka musi być podana w porządku chronologicznym
 * (najbliższe zakończenie pierwsze).
 */
export function settleFortress(state: FortressState, queue: QueueEntry[], now: Date): SettleResult {
  const levels: BuildingLevels = { ...state.buildingLevels };
  const resources: Resources = { ...state.resources };
  const nowMs = now.getTime();
  let cursorMs = state.lastProductionAt.getTime();

  const completed: QueueEntry[] = [];
  const remainingQueue: QueueEntry[] = [];

  for (const entry of queue) {
    const endMs = entry.endAt.getTime();
    const segmentEnd = Math.min(endMs, nowMs);
    accumulateProduction(levels, resources, cursorMs, segmentEnd);
    cursorMs = segmentEnd;

    if (endMs <= nowMs) {
      levels[entry.building] = entry.targetLevel;
      completed.push(entry);
    } else {
      remainingQueue.push(entry);
    }
  }

  accumulateProduction(levels, resources, cursorMs, nowMs);

  return {
    buildingLevels: levels,
    resources,
    lastProductionAt: now,
    completed,
    remainingQueue,
  };
}
