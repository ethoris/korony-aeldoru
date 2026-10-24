import { describe, expect, it } from "vitest";

import { armyFoodPerHour, settleArmies } from "../armySettle";

describe("settleArmies", () => {
  it("dolicza zakończone szkolenie do liczby jednostek", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const result = settleArmies(
      [{ unitKey: "WLOCZNIK", quantity: 10, trainingQuantity: 5, trainingEndAt: new Date("2026-01-01T11:00:00Z") }],
      now,
    );
    expect(result.armies[0]).toEqual({ unitKey: "WLOCZNIK", quantity: 15, trainingQuantity: 0, trainingEndAt: null });
    expect(result.completed).toEqual([{ unitKey: "WLOCZNIK", quantity: 5 }]);
  });

  it("nie dolicza szkolenia, które jeszcze trwa", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const result = settleArmies(
      [{ unitKey: "RYCERZ", quantity: 2, trainingQuantity: 3, trainingEndAt: new Date("2026-01-01T13:00:00Z") }],
      now,
    );
    expect(result.armies[0].quantity).toBe(2);
    expect(result.completed).toHaveLength(0);
  });

  it("liczy żywność/h całego wojska", () => {
    const armies = [
      { unitKey: "WLOCZNIK" as const, quantity: 10, trainingQuantity: 0, trainingEndAt: null },
      { unitKey: "RYCERZ" as const, quantity: 2, trainingQuantity: 0, trainingEndAt: null },
    ];
    const foodPerHour = { WLOCZNIK: 1, LUCZNIK: 1, RYCERZ: 3, MAG_BITEWNY: 2, TARAN: 4 };
    expect(armyFoodPerHour(armies, foodPerHour)).toBe(10 * 1 + 2 * 3);
  });
});
