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

  it("bonus bóstwa wlicza się razem z cechami ekwipunku", () => {
    const hero = buildHeroConfigFromEquipment({
      ...baseParams,
      equippedItems: [
        { slot: "WEAPON", damageMin: 10, damageMax: 20, armor: null, traits: [{ key: "damagePercent", value: 3, label: "x" }] },
      ],
      deity: "KORGATH",
    });

    expect(hero.gearDamagePercent).toBe(8); // 3 z ekwipunku + 5 od Korgatha (klasa walcząca wręcz)
  });

  it("bonus Solaris do leczenia trafia na healBonusPercent", () => {
    const hero = buildHeroConfigFromEquipment({ ...baseParams, classKey: "PRIEST", equippedItems: [], deity: "SOLARIS" });
    expect(hero.healBonusPercent).toBe(10);
  });

  it("bez bóstwa nie dodaje żadnego bonusu", () => {
    const hero = buildHeroConfigFromEquipment({ ...baseParams, equippedItems: [] });
    expect(hero.gearDamagePercent).toBe(0);
    expect(hero.healBonusPercent).toBe(0);
  });

  it("ulepszenie kowala dodaje +2% obrażeń broni i pancerza za poziom", () => {
    const hero = buildHeroConfigFromEquipment({
      ...baseParams,
      equippedItems: [
        { slot: "WEAPON", damageMin: 100, damageMax: 100, armor: null, traits: [], upgrade: 5 },
        { slot: "ARMOR", damageMin: null, damageMax: null, armor: 100, traits: [], upgrade: 5 },
      ],
    });
    expect(hero.weaponDamage).toBeCloseTo(110); // +10% (+5 poziomów × 2%)
    expect(hero.armorFromGear).toBeCloseTo(110);
  });

  it("runa kowala ustawia żywioł broni", () => {
    const hero = buildHeroConfigFromEquipment({
      ...baseParams,
      equippedItems: [{ slot: "WEAPON", damageMin: 10, damageMax: 20, armor: null, traits: [], rune: "ice" }],
    });
    expect(hero.gearWeaponElement).toBe("ice");
  });

  it("premia zestawu za 2 części (np. Wojownik I: +8% obrażeń) wliczona tylko przy 2+ częściach", () => {
    const oneItem = buildHeroConfigFromEquipment({
      ...baseParams,
      equippedItems: [{ slot: "WEAPON", damageMin: 10, damageMax: 20, armor: null, traits: [], templateKey: "wojownik-i:WEAPON" }],
    });
    expect(oneItem.gearDamagePercent).toBe(0);

    const twoItems = buildHeroConfigFromEquipment({
      ...baseParams,
      equippedItems: [
        { slot: "WEAPON", damageMin: 10, damageMax: 20, armor: null, traits: [], templateKey: "wojownik-i:WEAPON" },
        { slot: "HELMET", damageMin: null, damageMax: null, armor: 5, traits: [], templateKey: "wojownik-i:HELMET" },
      ],
    });
    expect(twoItems.gearDamagePercent).toBe(8);
  });

  it("premia zestawu za 2 części '% obrony' trafia na gearArmorPercent (np. Paladyn I)", () => {
    const hero = buildHeroConfigFromEquipment({
      ...baseParams,
      classKey: "PALADIN",
      equippedItems: [
        { slot: "WEAPON", damageMin: 10, damageMax: 20, armor: null, traits: [], templateKey: "paladyn-i:WEAPON" },
        { slot: "ARMOR", damageMin: null, damageMax: null, armor: 10, traits: [], templateKey: "paladyn-i:ARMOR" },
      ],
    });
    expect(hero.gearArmorPercent).toBe(10);
  });
});
