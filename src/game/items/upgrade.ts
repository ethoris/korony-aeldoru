import type { Element } from "@/game/combat/types";
import type { ItemSlot } from "@/game/items/types";

/** Sloty, które kowal ulepsza – nie amulety ani pierścienie (docs/gdd/08-ekwipunek.md). */
export const UPGRADABLE_SLOTS: ItemSlot[] = ["WEAPON", "OFFHAND", "HELMET", "ARMOR", "GLOVES", "BOOTS"];

export const MAX_UPGRADE_LEVEL = 10;

interface UpgradeTier {
  successPercent: number;
  kuzniaLevelRequired: number;
  canFail: boolean;
}

/** Tabela ulepszeń +1 do +10 (docs/gdd/08-ekwipunek.md); +11-20 to aktualizacja X, poza zakresem wersji 3. */
const UPGRADE_TABLE: Record<number, UpgradeTier> = {
  1: { successPercent: 100, kuzniaLevelRequired: 5, canFail: false },
  2: { successPercent: 100, kuzniaLevelRequired: 5, canFail: false },
  3: { successPercent: 100, kuzniaLevelRequired: 5, canFail: false },
  4: { successPercent: 95, kuzniaLevelRequired: 5, canFail: true },
  5: { successPercent: 90, kuzniaLevelRequired: 5, canFail: true },
  6: { successPercent: 80, kuzniaLevelRequired: 12, canFail: true },
  7: { successPercent: 70, kuzniaLevelRequired: 12, canFail: true },
  8: { successPercent: 60, kuzniaLevelRequired: 12, canFail: true },
  9: { successPercent: 50, kuzniaLevelRequired: 12, canFail: true },
  10: { successPercent: 40, kuzniaLevelRequired: 12, canFail: true },
};

export function upgradeTier(targetLevel: number): UpgradeTier | null {
  return UPGRADE_TABLE[targetLevel] ?? null;
}

/** Ochrona przed pechem: +5% szansy za każdą nieudaną próbę na tym przedmiocie, zerowane po sukcesie. */
export function upgradeSuccessChance(targetLevel: number, failStreak: number): number {
  const tier = upgradeTier(targetLevel);
  if (!tier) return 0;
  return Math.min(100, tier.successPercent + 5 * Math.max(0, failStreak));
}

/** +2% obrażeń broni lub pancerza za poziom ulepszenia (+10 = +20%). */
export function upgradeEffectPercent(upgradeLevel: number): number {
  return Math.min(MAX_UPGRADE_LEVEL, Math.max(0, upgradeLevel)) * 2;
}

export interface UpgradeCost {
  gold: number;
  iron: number;
  mana: number;
}

/** złoto = 20·P·U, żelazo = 10·P·U, od +6 dodatkowo mana = 2·P·(U−5) (P = poziom przedmiotu, U = poziom docelowy). */
export function upgradeCost(itemLevel: number, targetLevel: number): UpgradeCost {
  return {
    gold: 20 * itemLevel * targetLevel,
    iron: 10 * itemLevel * targetLevel,
    mana: targetLevel >= 6 ? 2 * itemLevel * (targetLevel - 5) : 0,
  };
}

/** Kuźnia poziomu 8 (docs/gdd/02-systemy-walki.md): runa zamienia 30% obrażeń broni na wybrany żywioł. */
export const RUNE_KUZNIA_LEVEL = 8;
export const RUNE_ELEMENT_DAMAGE_SHARE = 0.3;
export const RUNE_ELEMENTS: Element[] = ["fire", "ice", "lightning", "light", "shadow", "poison"];

/**
 * GDD nie podaje kosztu runy – tylko efekt i wymagany poziom Kuźni. Decyzja
 * własna (do przeglądu): stały koszt surowców z twierdzy, bez skalowania
 * poziomem (zamiana ma być swobodna, "każda klasa może przygotować się na
 * konkretnego bossa" – zbyt wysoki koszt by to utrudniał).
 */
export const RUNE_COST = { iron: 50, mana: 20 } as const;
