import { describe, expect, it } from "vitest";

import { buildHeroConfigFromEquipment } from "../combatLoadout";

describe("buildHeroConfigFromEquipment", () => {
  const baseParams = {
    classKey: "WARRIOR" as const,
    level: 10,
    stats: { strength: 20, dexterity: 10, vitality: 10, intellect: 10 },
  };

  it("sumuje procentowe cechy walki z całego ekwipunku", () => {
    const hero = buildHeroConfigFromEquipment({
      ...baseParams,
      equippedItems: [
        { slot: "WEAPON", damageMin: 10, damageMax: 20, armor: null, traits: [{ key: "damagePercent", value: 5, label: "x" }] },
        { slot: "GLOVES", damageMin: null, damageMax: null, armor: 3, traits: [{ key: "damagePercent", value: 3, label: "x" }] },
        { slot: "RING", damageMin: null, damageMax: null, armor: null, traits: [{ key: "hitPercent", value: 4, label: "x" }] },
      ],
    });

    expect(hero.gearDamagePercent).toBe(8);
    expect(hero.gearHitPercent).toBe(4);
  });

  it("ogranicza sumę cechy krytyka do limitu z docs/gdd/08-ekwipunek.md (10)", () => {
    const hero = buildHeroConfigFromEquipment({
      ...baseParams,
      equippedItems: [
        { slot: "WEAPON", damageMin: 10, damageMax: 20, armor: null, traits: [{ key: "critPercent", value: 4, label: "x" }] },
        { slot: "GLOVES", damageMin: null, damageMax: null, armor: 3, traits: [{ key: "critPercent", value: 4, label: "x" }] },
        { slot: "RING", damageMin: null, damageMax: null, armor: null, traits: [{ key: "critPercent", value: 4, label: "x" }] },
      ],
    });

    expect(hero.gearCritPercent).toBe(10);
  });

  it("cecha żywiołu broni ustawia żywioł zamiast fizycznych obrażeń", () => {
    const hero = buildHeroConfigFromEquipment({
      ...baseParams,
      equippedItems: [
        {
          slot: "WEAPON",
          damageMin: 10,
          damageMax: 20,
          armor: null,
          traits: [{ key: "elementalWeaponDamagePercent", value: 10, label: "x", element: "fire" }],
        },
      ],
    });

    expect(hero.gearWeaponElement).toBe("fire");
  });

  it("cecha żywiołu broni na innym slocie niż broń jest ignorowana", () => {
    const hero = buildHeroConfigFromEquipment({
      ...baseParams,
      equippedItems: [
        {
          slot: "RING",
          damageMin: null,
          damageMax: null,
          armor: null,
          traits: [{ key: "elementalWeaponDamagePercent", value: 10, label: "x", element: "fire" }],
        },
      ],
    });

    expect(hero.gearWeaponElement).toBeUndefined();
  });
});
