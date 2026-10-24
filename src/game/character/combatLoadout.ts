import { computeArmorTotal, computeShieldArmor, computeWeaponDamage } from "@/game/combat/equipment";
import type { ClassKey, Element, HeroConfig, Stats, Tactic } from "@/game/combat/types";

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
