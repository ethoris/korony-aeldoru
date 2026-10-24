import { describe, expect, it } from "vitest";

import { deityCombatBonuses, deityExpeditionBonuses, deityLossReduction } from "../deities";

describe("deityCombatBonuses", () => {
  it("Korgath daje +5% obrażeń tylko klasom walczącym wręcz", () => {
    expect(deityCombatBonuses("KORGATH", "WARRIOR").damagePercent).toBe(5);
    expect(deityCombatBonuses("KORGATH", "ARCHER").damagePercent).toBe(0);
    expect(deityCombatBonuses("KORGATH", "MAGE").damagePercent).toBe(0);
  });

  it("Veyl daje +5% krytyka każdej klasie", () => {
    expect(deityCombatBonuses("VEYL", "PRIEST").critPercent).toBe(5);
  });

  it("Thessa daje +5% trafienia tylko Łucznikowi", () => {
    expect(deityCombatBonuses("THESSA", "ARCHER").hitPercent).toBe(5);
    expect(deityCombatBonuses("THESSA", "ROGUE").hitPercent).toBe(0);
  });

  it("Solaris daje +10% skuteczności leczenia", () => {
    expect(deityCombatBonuses("SOLARIS", "PRIEST").healPercent).toBe(10);
  });

  it("inne bóstwo nie daje żadnego z tych bonusów", () => {
    const bonuses = deityCombatBonuses("ILYRA", "WARRIOR");
    expect(bonuses).toEqual({ damagePercent: 0, critPercent: 0, hitPercent: 0, healPercent: 0 });
  });
});

describe("deityLossReduction", () => {
  it("Morrak zmniejsza straty po przegranej o 25%", () => {
    expect(deityLossReduction("MORRAK")).toBe(0.25);
    expect(deityLossReduction("SOLARIS")).toBe(0);
  });
});

describe("deityExpeditionBonuses", () => {
  it("Ilyra daje +10% PD, Mardun +10% złota", () => {
    expect(deityExpeditionBonuses("ILYRA")).toEqual({ xpPercent: 10, goldPercent: 0 });
    expect(deityExpeditionBonuses("MARDUN")).toEqual({ xpPercent: 0, goldPercent: 10 });
  });
});
