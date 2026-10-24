import type { ClassKey } from "@/game/combat/types";
import { CLASSES } from "./classes";
import { tierMultiplier } from "./deityQuests";

export type DeityKey = "SOLARIS" | "KORGATH" | "ILYRA" | "VEYL" | "MARDUN" | "THESSA" | "MORRAK";

export interface DeityDefinition {
  key: DeityKey;
  name: string;
  domain: string;
  bonus: string;
}

// docs/gdd/00-glowny.md – bonusy bóstw (zdobywane od stworzenia postaci;
// sama mechanika bonusu jest wliczona w silnik walki/wyprawy w kolejnych krokach).
export const DEITIES: Record<DeityKey, DeityDefinition> = {
  SOLARIS: { key: "SOLARIS", name: "Solaris", domain: "światło, uzdrawianie", bonus: "+10% skuteczności leczenia i zaklęć ochronnych" },
  KORGATH: { key: "KORGATH", name: "Korgath", domain: "wojna, stal", bonus: "+5% obrażeń w walce wręcz" },
  ILYRA: { key: "ILYRA", name: "Ilyra", domain: "magia, gwiazdy", bonus: "+10% doświadczenia z wypraw" },
  VEYL: { key: "VEYL", name: "Veyl", domain: "cienie, podstęp", bonus: "+5% szansy na trafienie krytyczne" },
  MARDUN: { key: "MARDUN", name: "Mardun", domain: "handel, złoto", bonus: "+10% złota z wypraw i handlu" },
  THESSA: { key: "THESSA", name: "Thessa", domain: "natura, łowy", bonus: "+5% celności broni dystansowej" },
  MORRAK: { key: "MORRAK", name: "Morrak", domain: "śmierć, przeznaczenie", bonus: "25% mniejsze straty po przegranej walce" },
};

/**
 * Mechaniczne przełożenie bonusów bóstw na silnik walki (docs/gdd/00-glowny.md).
 * Uproszczenia:
 * - Solaris "zaklęcia ochronne" liczymy jako wszystkie leczenia w walce
 *   (cechy klas, Odnowa, mikstury życia) – bonus do tarcz/redukcji obrażeń
 *   pominięty, bo to już osobna, mniej jednoznaczna kategoria.
 * - Mardun "i handlu" nie ma jeszcze żadnego mechanicznego efektu – gra nie
 *   ma jeszcze sprzedaży przedmiotów NPC ani handlu między graczami.
 */
export function deityCombatBonuses(deity: DeityKey, classKey: ClassKey, grace = 0): {
  damagePercent: number;
  critPercent: number;
  hitPercent: number;
  healPercent: number;
} {
  const weaponType = CLASSES[classKey].weaponType;
  const isMelee = weaponType !== "bow" && weaponType !== "spells";
  const mult = tierMultiplier(grace);

  return {
    damagePercent: deity === "KORGATH" && isMelee ? 5 * mult : 0,
    critPercent: deity === "VEYL" ? 5 * mult : 0,
    hitPercent: deity === "THESSA" && classKey === "ARCHER" ? 5 * mult : 0,
    healPercent: deity === "SOLARIS" ? 10 * mult : 0,
  };
}

/** Bonus Morraka do strat po przegranej (rana i złoto przy sobie), docs/gdd/02-systemy-walki.md. */
export function deityLossReduction(deity: DeityKey, grace = 0): number {
  return deity === "MORRAK" ? 0.25 * tierMultiplier(grace) : 0;
}

/** +% PD/złota z wypraw (Ilyra/Mardun), docs/gdd/11-gospodarka-i-zadania.md. */
export function deityExpeditionBonuses(deity: DeityKey, grace = 0): { xpPercent: number; goldPercent: number } {
  const mult = tierMultiplier(grace);
  return {
    xpPercent: deity === "ILYRA" ? 10 * mult : 0,
    goldPercent: deity === "MARDUN" ? 10 * mult : 0,
  };
}
