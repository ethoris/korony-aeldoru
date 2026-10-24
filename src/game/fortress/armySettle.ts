import type { UnitKey } from "@/game/data/units";

export interface ArmyRow {
  unitKey: UnitKey;
  quantity: number;
  trainingQuantity: number;
  trainingEndAt: Date | null;
}

export interface ArmySettleResult {
  armies: ArmyRow[];
  completed: { unitKey: UnitKey; quantity: number }[];
}

/** Dolicza zakończone szkolenia (docs/gdd/09-twierdza-i-wojna.md) – bez procesów w tle, liczy się przy wejściu. */
export function settleArmies(armies: ArmyRow[], now: Date): ArmySettleResult {
  const completed: { unitKey: UnitKey; quantity: number }[] = [];
  const result = armies.map((row) => {
    if (row.trainingEndAt && row.trainingEndAt.getTime() <= now.getTime() && row.trainingQuantity > 0) {
      completed.push({ unitKey: row.unitKey, quantity: row.trainingQuantity });
      return { unitKey: row.unitKey, quantity: row.quantity + row.trainingQuantity, trainingQuantity: 0, trainingEndAt: null };
    }
    return row;
  });
  return { armies: result, completed };
}

/** Żywność/h zużywana przez całe wojsko (do odliczenia z magazynu w tej samej transakcji co produkcja). */
export function armyFoodPerHour(armies: ArmyRow[], unitFoodPerHour: Record<UnitKey, number>): number {
  return armies.reduce((sum, row) => sum + row.quantity * (unitFoodPerHour[row.unitKey] ?? 0), 0);
}
