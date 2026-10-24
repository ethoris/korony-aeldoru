import { describe, expect, it } from "vitest";

import { isNewPlayerProtected, protectionEndsAt } from "../newPlayerProtection";

describe("newPlayerProtection", () => {
  it("chroni przez pierwsze 7 dni", () => {
    const createdAt = new Date("2026-01-01T00:00:00Z");
    expect(isNewPlayerProtected(createdAt, new Date("2026-01-01T00:00:01Z"))).toBe(true);
    expect(isNewPlayerProtected(createdAt, new Date("2026-01-07T23:59:59Z"))).toBe(true);
  });

  it("przestaje chronić po 7 dniach", () => {
    const createdAt = new Date("2026-01-01T00:00:00Z");
    expect(isNewPlayerProtected(createdAt, new Date("2026-01-08T00:00:01Z"))).toBe(false);
  });

  it("protectionEndsAt = createdAt + 7 dni", () => {
    const createdAt = new Date("2026-01-01T00:00:00Z");
    expect(protectionEndsAt(createdAt).toISOString()).toBe("2026-01-08T00:00:00.000Z");
  });
});
