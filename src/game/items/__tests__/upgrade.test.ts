import { describe, expect, it } from "vitest";

import { upgradeCost, upgradeEffectPercent, upgradeSuccessChance, upgradeTier } from "../upgrade";

describe("upgrade", () => {
  it("szanse powodzenia zgadzają się z tabelą GDD", () => {
    expect(upgradeTier(1)?.successPercent).toBe(100);
    expect(upgradeTier(4)?.successPercent).toBe(95);
    expect(upgradeTier(10)?.successPercent).toBe(40);
    expect(upgradeTier(11)).toBeNull();
  });

  it("ochrona przed pechem dodaje 5% za każdą porażkę, max 100%", () => {
    expect(upgradeSuccessChance(10, 0)).toBe(40);
    expect(upgradeSuccessChance(10, 1)).toBe(45);
    expect(upgradeSuccessChance(10, 20)).toBe(100);
  });

  it("efekt ulepszenia to +2% za poziom, +10 = +20%", () => {
    expect(upgradeEffectPercent(1)).toBe(2);
    expect(upgradeEffectPercent(10)).toBe(20);
  });

  it("koszt = 20·P·U złota, 10·P·U żelaza, od +6 dodatkowo mana", () => {
    expect(upgradeCost(50, 4)).toEqual({ gold: 4000, iron: 2000, mana: 0 });
    expect(upgradeCost(50, 6)).toEqual({ gold: 6000, iron: 3000, mana: 100 });
  });
});
