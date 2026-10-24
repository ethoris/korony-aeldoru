import { describe, expect, it } from "vitest";

import { expectedScore, fameDelta, rankForFame } from "../fame";

describe("fame", () => {
  it("równi przeciwnicy: E=0,5, wygrana daje +16, przegrana -16", () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5);
    expect(fameDelta(1000, 1000, true)).toBe(16);
    expect(fameDelta(1000, 1000, false)).toBe(-16);
  });

  it("pokonanie silniejszego daje więcej niż słabszego", () => {
    const beatStronger = fameDelta(1000, 1400, true);
    const beatWeaker = fameDelta(1000, 600, true);
    expect(beatStronger).toBeGreaterThan(beatWeaker);
  });

  it("przegrana z silniejszym kosztuje niewiele", () => {
    const loseToStronger = fameDelta(1000, 1400, false);
    expect(loseToStronger).toBeGreaterThanOrEqual(-10);
    expect(loseToStronger).toBeLessThan(0);
  });

  it("rangi zgadzają się z tabelą GDD", () => {
    expect(rankForFame(1199)).toBe("Brąz");
    expect(rankForFame(1200)).toBe("Srebro");
    expect(rankForFame(1400)).toBe("Złoto");
    expect(rankForFame(1600)).toBe("Mistrz");
    expect(rankForFame(1800)).toBe("Legenda");
  });
});
