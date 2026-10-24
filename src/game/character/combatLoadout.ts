import { computeArmorTotal, computeShieldArmor, computeWeaponDamage } from "@/game/combat/equipment";
import type { ClassKey, Element, HeroConfig, Stats, Tactic } from "@/game/combat/types";
import { AFFIXES } from "@/game/data/itemAffixes";
import type { ItemAffixInstance, ItemSlot } from "@/game/items/types";

/**
 * Buduje konfigurację bohatera do silnika walki z PRAWDZIWYCH statystyk
 * postaci. Ekwipunek (krok 6) jeszcze nie istnieje, więc na razie liczymy
 * uzbrojenie jak magiczny przedmiot własnego poziomu – to tymczasowe
 * rusztowanie, zastąpione realnym odczytem założonych przedmiotów w kroku 6.
 */
export function buildHeroConfigForCombat(params: {
  classKey: ClassKey;
  level: number;
  stats: Stats;
  tactic?: Tactic;
  spellElement?: Element;
  startingHpOverride?: number;
}): HeroConfig {
  const hasShield = params.classKey === "PALADIN";
  const armorFromGear =
    computeArmorTotal(params.classKey, params.level) + (hasShield ? computeShieldArmor(params.level) : 0);

  return {
    classKey: params.classKey,
    level: params.level,
    stats: params.stats,
    weaponDamage: computeWeaponDamage(params.classKey, params.level),
    armorFromGear,
    tactic: params.tactic ?? "BALANCED",
    spellElement: params.spellElement ?? "fire",
    hasShield,
    startingHpOverride: params.startingHpOverride,
  };
}

export interface EquippedItemSummary {
  slot: ItemSlot;
  damageMin: number | null;
  damageMax: number | null;
  armor: number | null;
  traits: ItemAffixInstance[];
}

/**
 * Buduje konfigurację bohatera z NAPRAWDĘ założonych przedmiotów. Płaskie
 * cechy (+SIŁ/+ZRĘ/+WYT/+INT, +PŻ) i procentowe cechy walki (+% obrażeń/
 * krytyka/trafienia/bloku, żywioł broni) są wliczone. Odporność na żywioł
 * (elementResistPercent) NIE jest jeszcze wliczona – żaden potwór w tej
 * wersji nie zadaje obrażeń żywiołem (ataki potworów są zawsze fizyczne,
 * docs/gdd/04-bestiariusz.md typy żywiołów potworów nie są jeszcze
 * podłączone do ich własnych atakow), więc cecha nie miałaby jak zadziałać.
 */
export function buildHeroConfigFromEquipment(params: {
  classKey: ClassKey;
  level: number;
  stats: Stats;
  tactic?: Tactic;
  spellElement?: Element;
  startingHpOverride?: number;
  equippedItems: EquippedItemSummary[];
  selectedAbilities?: string[];
}): HeroConfig {
  const weapon = params.equippedItems.find((i) => i.slot === "WEAPON");
  const weaponDamage =
    weapon && weapon.damageMin != null && weapon.damageMax != null ? (weapon.damageMin + weapon.damageMax) / 2 : 0;

  const armorFromGear = params.equippedItems.reduce((sum, item) => sum + (item.armor ?? 0), 0);
  const hasShield = params.classKey === "PALADIN" && params.equippedItems.some((i) => i.slot === "OFFHAND");

  const stats: Stats = { ...params.stats };
  let bonusMaxHp = 0;
  let gearDamagePercent = 0;
  let gearCritPercent = 0;
  let gearHitPercent = 0;
  let gearBlockPercent = 0;
  let gearWeaponElement: Element | undefined;

  for (const item of params.equippedItems) {
    for (const affix of item.traits) {
      switch (affix.key) {
        case "strength":
          stats.strength += affix.value;
          break;
        case "dexterity":
          stats.dexterity += affix.value;
          break;
        case "vitality":
          stats.vitality += affix.value;
          break;
        case "intellect":
          stats.intellect += affix.value;
          break;
        case "maxHp":
          bonusMaxHp += affix.value;
          break;
        case "damagePercent":
          gearDamagePercent += affix.value;
          break;
        case "critPercent":
          gearCritPercent += affix.value;
          break;
        case "hitPercent":
          gearHitPercent += affix.value;
          break;
        case "blockPercent":
          gearBlockPercent += affix.value;
          break;
        case "elementalWeaponDamagePercent":
          if (item.slot === "WEAPON" && affix.element) gearWeaponElement = affix.element;
          break;
        default:
          break;
      }
    }
  }

  return {
    classKey: params.classKey,
    level: params.level,
    stats,
    weaponDamage,
    armorFromGear,
    tactic: params.tactic ?? "BALANCED",
    spellElement: params.spellElement ?? "fire",
    hasShield,
    startingHpOverride: params.startingHpOverride,
    bonusMaxHp,
    selectedAbilities: params.selectedAbilities,
    gearDamagePercent,
    gearCritPercent: Math.min(gearCritPercent, AFFIXES.critPercent.cap ?? Infinity),
    gearHitPercent,
    gearBlockPercent,
    gearWeaponElement,
  };
}
