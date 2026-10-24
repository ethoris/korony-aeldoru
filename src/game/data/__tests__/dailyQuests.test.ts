import { describe, expect, it } from "vitest";

import { generateDailyQuests } from "../dailyQuests";

describe("generateDailyQuests", () => {
  it("zawsze daje 3 różne typy zadań", () => {
    const slots = generateDailyQuests("char-1", "2026-10-24");
    expect(slots).toHaveLength(3);
    expect(new Set(slots.map((s) => s.type)).size).toBe(3);
  });

  it("ta sama postać i dzień dają te same zadania (deterministyczne)", () => {
    const a = generateDailyQuests("char-1", "2026-10-24");
    const b = generateDailyQuests("char-1", "2026-10-24");
    expect(a).toEqual(b);
  });

  it("inny dzień odnawia zadania", () => {
    const day1 = generateDailyQuests("char-1", "2026-10-24");
    const day2 = generateDailyQuests("char-1", "2026-10-25");
    expect(day1).not.toEqual(day2);
  });

  it("inna postać może dostać inny zestaw tego samego dnia", () => {
    const a = generateDailyQuests("char-1", "2026-10-24");
    const b = generateDailyQuests("char-2", "2026-10-24");
    expect(a).not.toEqual(b);
  });
});
