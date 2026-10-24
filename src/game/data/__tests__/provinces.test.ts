import { describe, expect, it } from "vitest";

import { PROVINCES, ZONE_GARRISON, ZONE_TAX_PERCENT, getProvince, provincesInRegion } from "../provinces";

describe("provinces", () => {
  it("50 prowincji w 5 regionach po 10", () => {
    expect(PROVINCES).toHaveLength(50);
    for (let region = 1; region <= 5; region++) {
      expect(provincesInRegion(region)).toHaveLength(10);
    }
  });

  it("klucze są unikalne", () => {
    expect(new Set(PROVINCES.map((p) => p.key)).size).toBe(50);
  });

  it("liczba prowincji per strefa zgadza się z tabelą GDD (12/14/12/8/4)", () => {
    const counts = [1, 2, 3, 4, 5].map((zone) => PROVINCES.filter((p) => p.zone === zone).length);
    expect(counts).toEqual([12, 14, 12, 8, 4]);
  });

  it("garnizon NPC = 200 x strefa", () => {
    expect(ZONE_GARRISON[1]).toBe(200);
    expect(ZONE_GARRISON[5]).toBe(1000);
  });

  it("podatek zgadza się z tabelą GDD", () => {
    expect(ZONE_TAX_PERCENT).toEqual({ 1: 3, 2: 4, 3: 5, 4: 6, 5: 8 });
  });

  it("getProvince znajduje po kluczu", () => {
    expect(getProvince("wilczy-kres")?.name).toBe("Wilczy Kres");
    expect(getProvince("nieistniejaca")).toBeUndefined();
  });
});
