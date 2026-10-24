import type { Element } from "./types";

/** PŻ = 50 + 12·WYT + 8·poziom (docs/gdd/02-systemy-walki.md). */
export function heroMaxHp(vitality: number, level: number): number {
  return 50 + 12 * vitality + 8 * level;
}

/** PŻ potwora = 40 + 22·poziom (docs/gdd/04-bestiariusz.md); boss ×2,5. */
export function monsterMaxHp(level: number, isBoss: boolean): number {
  const base = 40 + 22 * level;
  return isBoss ? base * 2.5 : base;
}

/** Atak potwora = 8 + 2,2·poziom; boss ×1,3. */
export function monsterAttack(level: number, isBoss: boolean): number {
  const base = 8 + 2.2 * level;
  return isBoss ? base * 1.3 : base;
}

/** Obrona potwora = 2 + 0,8·poziom; boss ×1,3. */
export function monsterDefense(level: number, isBoss: boolean): number {
  const base = 2 + 0.8 * level;
  return isBoss ? base * 1.3 : base;
}

/** Zręczność potwora = 10 + poziom (tak samo dla bossów). */
export function monsterDexterity(level: number): number {
  return 10 + level;
}

/** Atak = obrażenia broni · (1 + 2S / (S + 100)); S = statystyka główna klasy. */
export function attackPower(weaponDamage: number, mainStat: number): number {
  return weaponDamage * (1 + (2 * mainStat) / (mainStat + 100));
}

/** Obrona = pancerz z ekwipunku + WYT ÷ 2. */
export function heroDefense(armorFromGear: number, vitality: number): number {
  return armorFromGear + vitality / 2;
}

/** redukcja = Obrona / (Obrona + 10·poziom atakującego + 50). */
export function damageReduction(defense: number, attackerLevel: number): number {
  return defense / (defense + 10 * attackerLevel + 50);
}

/** Przewaga zręczności = (ZRE_a − ZRE_b) / (suma poziomów + 20), w [-1, 1]. */
export function dexterityAdvantage(
  attackerDex: number,
  defenderDex: number,
  attackerLevel: number,
  defenderLevel: number,
): number {
  const raw = (attackerDex - defenderDex) / (attackerLevel + defenderLevel + 20);
  return Math.min(1, Math.max(-1, raw));
}

/** Trafienie = 80% + 1%·różnica poziomów + 10%·przewaga zręczności, w [50%, 95%]. */
export function hitChance(
  attackerLevel: number,
  defenderLevel: number,
  dexAdvantage: number,
): number {
  const raw = 0.8 + 0.01 * (attackerLevel - defenderLevel) + 0.1 * dexAdvantage;
  return Math.min(0.95, Math.max(0.5, raw));
}

/** Krytyk = 5% + 10%·min(1, (ZRE−10)/(2·poziom)), maks. 15%. */
export function critChance(dexterity: number, level: number): number {
  const scaled = level > 0 ? (dexterity - 10) / (2 * level) : 0;
  return Math.min(0.15, 0.05 + 0.1 * Math.min(1, Math.max(0, scaled)));
}

/** Inicjatywa = ZRE + losowo 1–10. */
export function initiative(dexterity: number, roll: number): number {
  return dexterity + roll;
}

export const CRIT_MULTIPLIER = 1.5;

/** Mnożnik żywiołu: słabość +25%, odporność −40%, inaczej brak zmiany. */
export function elementMultiplier(element: Element, weakTo: Element[], resistTo: Element[]): number {
  if (weakTo.includes(element)) return 1.25;
  if (resistTo.includes(element)) return 0.6;
  return 1;
}

export function turnLimit(isBoss: boolean): number {
  return isBoss ? 20 : 15;
}
