import { CLASSES, allocateStats } from "@/game/data/classes";

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
