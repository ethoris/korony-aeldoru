import { describe, expect, it } from "vitest";

import { dayKeyFor } from "../dailyReset";

describe("dayKeyFor", () => {
  it("przed 6:00 UTC liczy się jako poprzedni dzień", () => {
    expect(dayKeyFor(new Date("2026-10-24T05:59:00Z"))).toBe("2026-10-23");
  });

  it("od 6:00 UTC liczy się jako nowy dzień", () => {
    expect(dayKeyFor(new Date("2026-10-24T06:00:00Z"))).toBe("2026-10-24");
  });
});
