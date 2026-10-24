import { describe, expect, it } from "vitest";

import { paidResetCost, resetKindFor } from "../statReset";

describe("resetKindFor", () => {
  it("poziom 1-20: zawsze darmowy", () => {
    expect(resetKindFor(1, false)).toBe("FREE_UNDER_21");
    expect(resetKindFor(20, true)).toBe("FREE_UNDER_21");
  });

  it("pierwszy reset od 21: darmowy, raz", () => {
    expect(resetKindFor(21, false)).toBe("FREE_FIRST_AFTER_20");
  });

  it("kolejne resety od 21: płatne", () => {
    expect(resetKindFor(21, true)).toBe("PAID");
    expect(resetKindFor(60, true)).toBe("PAID");
  });
});

describe("paidResetCost", () => {
  it("przykład z GDD: poziom 60, pierwszy płatny reset w miesiącu = 1500 złota", () => {
    expect(paidResetCost(60, 0)).toBe(1500);
  });

  it("przykład z GDD: poziom 60, drugi płatny reset w miesiącu = 3000 złota", () => {
    expect(paidResetCost(60, 1)).toBe(3000);
  });

  it("mnożnik n jest ograniczony do 5", () => {
    expect(paidResetCost(60, 10)).toBe(25 * 60 * 5);
  });
});
