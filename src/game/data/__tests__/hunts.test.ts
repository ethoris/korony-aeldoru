import { describe, expect, it } from "vitest";

import { generateHunts } from "../hunts";

describe("generateHunts", () => {
  it("zawsze generuje 3 sloty z celem 3-8 wygranych", () => {
    const slots = generateHunts("goblinia-nora", "2026-10-24");
    expect(slots).toHaveLength(3);
    for (const slot of slots) {
      expect(slot.target).toBeGreaterThanOrEqual(3);
      expect(slot.target).toBeLessThanOrEqual(8);
    }
  });

  it("ta sama lokacja i dzień dają te same łowy (deterministyczne)", () => {
    const a = generateHunts("goblinia-nora", "2026-10-24");
    const b = generateHunts("goblinia-nora", "2026-10-24");
    expect(a).toEqual(b);
  });

  it("inny dzień daje inny zestaw (odnawia się co dobę)", () => {
    const day1 = generateHunts("goblinia-nora", "2026-10-24");
    const day2 = generateHunts("goblinia-nora", "2026-10-25");
    expect(day1).not.toEqual(day2);
  });

  it("inna lokacja daje inny zestaw niż inna lokacja tego samego dnia", () => {
    const a = generateHunts("goblinia-nora", "2026-10-24");
    const b = generateHunts("piwnice-karczmy", "2026-10-24");
    expect(a).not.toEqual(b);
  });

  it("klucze slotów są unikalne i zawierają lokację i dzień", () => {
    const slots = generateHunts("goblinia-nora", "2026-10-24");
    const keys = slots.map((s) => s.key);
    expect(new Set(keys).size).toBe(3);
    for (const key of keys) {
      expect(key).toContain("goblinia-nora");
      expect(key).toContain("2026-10-24");
    }
  });
});
