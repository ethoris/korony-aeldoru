import { CLASSES, allocateStats } from "@/game/data/classes";
import { ABILITIES } from "@/game/data/abilities";
import { deityCombatBonuses } from "@/game/data/deities";
import type { DeityKey } from "@/game/data/deities";
import { AFFIXES } from "@/game/data/itemAffixes";
import { SETS, setsForClass } from "@/game/data/sets";
import { upgradeEffectPercent } from "@/game/items/upgrade";

import type { ClassKey } from "./types";
import type { HeroConfig } from "./types";

/** Mnożnik jakości z docs/gdd/08-ekwipunek.md. */
export const QUALITY_MULTIPLIER = {
  COMMON: 1.0,
  MAGIC: 1.05,
  RARE: 1.1,
  LEGENDARY: 1.2,
  SET: 1.15,
} as const;

export type Quality = keyof typeof QUALITY_MULTIPLIER;

/** średnie obrażenia broni = (10 + 2,4·poziom) · mnożnik typu · mnożnik jakości. */
export function computeWeaponDamage(classKey: ClassKey, level: number, quality: Quality = "MAGIC"): number {
  const def = CLASSES[classKey];
  return (10 + 2.4 * level) * def.weaponMultiplier * QUALITY_MULTIPLIER[quality];
}

/** Pancerz (suma zbroi+hełmu+butów+rękawic) = poziom · mnożnik pancerza klasy · mnożnik jakości. */
export function computeArmorTotal(classKey: ClassKey, level: number, quality: Quality = "MAGIC"): number {
  const def = CLASSES[classKey];
  return level * def.armorMultiplier * QUALITY_MULTIPLIER[quality];
}

/** Dodatkowy pancerz z tarczy Paladyna: 0,2·poziom · mnożnik jakości. */
export function computeShieldArmor(level: number, quality: Quality = "MAGIC"): number {
  return 0.2 * level * QUALITY_MULTIPLIER[quality];
}

/**
 * Buduje bohatera testowego jak w metodologii docs/gdd/15-balans.md: punkty
 * statystyk rozdane 2 na poziom w główną + 1 w WYT, magiczny ekwipunek
 * swojego poziomu, bez zdolności/mikstur/zestawów.
 */
export function buildBalanceTestHero(classKey: ClassKey, level: number): HeroConfig {
  const stats = allocateStats(classKey, level);
  const hasShield = classKey === "PALADIN";
  const armorFromGear = computeArmorTotal(classKey, level) + (hasShield ? computeShieldArmor(level) : 0);

  return {
    classKey,
    level,
    stats,
    weaponDamage: computeWeaponDamage(classKey, level),
    armorFromGear,
    tactic: "BALANCED",
    spellElement: "fire",
    hasShield,
  };
}

/**
 * Deity domyślnie przypisane w "pełnej" symulacji balansu (trzecia symulacja,
 * docs/gdd/15-balans.md: "Wszystkie wyniki powtórzyć po zakodowaniu zdolności,
 * mikstur, zestawów i ulepszeń do +10"). Dobór wg tego, który bonus bóstwa
 * (src/game/data/deities.ts) ma mechaniczny wpływ na walkę tej klasy;
 * do przeglądu z Patrykiem – żadna liczba balansu nie jest tu zmieniana,
 * to tylko scenariusz testowy.
 */
const BALANCE_TEST_DEITY: Record<ClassKey, DeityKey> = {
  WARRIOR: "KORGATH",
  PALADIN: "SOLARIS",
  ARCHER: "THESSA",
  ROGUE: "VEYL",
  MAGE: "VEYL",
  PRIEST: "SOLARIS",
};

/** Łaska bóstwa przyjęta dla danego poziomu (zadania bóstw odblokowują się co 10 poz. od 10 do 100; do przeglądu). */
function assumedDeityGrace(level: number): number {
  return Math.min(5, Math.floor(level / 25)) * 10;
}

/** Do 3 zdolności spoza poziomu 1 (ta jest automatyczna), najwyższe odblokowane na danym poziomie. */
function bestAbilitiesForLevel(classKey: ClassKey, level: number): string[] {
  return ABILITIES[classKey]
    .filter((a) => a.level > 1 && a.level <= level)
    .sort((a, b) => b.level - a.level)
    .slice(0, 3)
    .map((a) => a.key);
}

/** Najlepszy zestaw klasowy posiadany na danym poziomie (zestawy od poz. 50, docs/gdd/08-ekwipunek.md). */
function bestSetForLevel(classKey: ClassKey, level: number) {
  const sets = setsForClass(classKey);
  const owned = sets.filter((s) => s.level <= level);
  if (owned.length === 0) return null;
  return owned.reduce((best, s) => (s.level > best.level ? s : best));
}

/**
 * Bohater "pełnej" symulacji balansu: jak buildBalanceTestHero, plus
 * ulepszenie ekwipunku do +10 (docs/gdd/08-ekwipunek.md, +2%/poziom = +20%),
 * 3 najlepsze odblokowane zdolności, pasek 3 najlepszych mikstur bojowych
 * (docs/gdd/11-gospodarka-i-zadania.md), premia 2 części zestawu klasowego
 * jeśli już zdobyty na tym poziomie, i bonus bóstwa (BALANCE_TEST_DEITY).
 */
export function buildFullGearTestHero(classKey: ClassKey, level: number): HeroConfig {
  const base = buildBalanceTestHero(classKey, level);
  const upgradeMult = 1 + upgradeEffectPercent(10) / 100;

  const deity = BALANCE_TEST_DEITY[classKey];
  const grace = assumedDeityGrace(level);
  const deityBonus = deityCombatBonuses(deity, classKey, grace);

  let gearDamagePercent = deityBonus.damagePercent;
  let gearCritPercent = deityBonus.critPercent;
  const gearHitPercent = deityBonus.hitPercent;
  let gearArmorPercent = 0;
  let healBonusPercent = deityBonus.healPercent;

  const set = bestSetForLevel(classKey, level);
  if (set) {
    const bonus = SETS[set.key].twoPieceBonus;
    if (bonus.kind === "damagePercent") gearDamagePercent += bonus.value;
    else if (bonus.kind === "critPercent") gearCritPercent += bonus.value;
    else if (bonus.kind === "armorPercent") gearArmorPercent += bonus.value;
    else if (bonus.kind === "healPercent") healBonusPercent += bonus.value;
    // "textOnly" (np. trucizna Łotra) nie jest jeszcze mechanicznie wpięte w silnik – pominięte, jak w combatLoadout.ts.
  }

  return {
    ...base,
    weaponDamage: base.weaponDamage * upgradeMult,
    armorFromGear: base.armorFromGear * upgradeMult,
    selectedAbilities: bestAbilitiesForLevel(classKey, level),
    selectedPotions: ["duza-mikstura-zycia", "eliksir-sily", "eliksir-kamiennej-skory"],
    gearDamagePercent,
    gearCritPercent: Math.min(gearCritPercent, AFFIXES.critPercent.cap ?? Infinity),
    gearHitPercent,
    gearArmorPercent,
    healBonusPercent,
  };
}
