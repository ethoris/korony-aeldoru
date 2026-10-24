import { describe, expect, it } from "vitest";

import { nextBattleSlot } from "../siegeSchedule";

describe("nextBattleSlot", () => {
  it("ogłoszenie o 1:00 → +12h = 13:00, najbliższe okno to 18:00 tego dnia", () => {
    const announced = new Date("2026-03-10T01:00:00.000Z");
    const slot = nextBattleSlot(announced);
    expect(slot.toISOString()).toBe("2026-03-10T18:00:00.000Z");
  });

  it("ogłoszenie o 10:00 → +12h = 22:00, okno 18:00 tego dnia już minęło → następny dzień", () => {
    const announced = new Date("2026-03-10T10:00:00.000Z");
    const slot = nextBattleSlot(announced);
    expect(slot.toISOString()).toBe("2026-03-11T18:00:00.000Z");
  });

  it("zawsze co najmniej 12h po ogłoszeniu", () => {
    for (let hour = 0; hour < 24; hour++) {
      const announced = new Date(Date.UTC(2026, 0, 1, hour));
      const slot = nextBattleSlot(announced);
      expect(slot.getTime() - announced.getTime()).toBeGreaterThanOrEqual(12 * 60 * 60 * 1000);
      expect(slot.getUTCHours()).toBe(18);
    }
  });
});
