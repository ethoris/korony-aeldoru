/**
 * Koszt kolejnego (płatnego) resetu statystyk (docs/gdd/01-bohater-i-konto.md):
 * 25 × poziom × n, gdzie n = numer płatnego resetu w ostatnich 30 dniach
 * (maks. ×5).
 */
export function paidResetCost(level: number, paidResetsInLast30Days: number): number {
  const n = Math.min(paidResetsInLast30Days + 1, 5);
  return 25 * level * n;
}

export type ResetKind = "FREE_UNDER_21" | "FREE_FIRST_AFTER_20" | "PAID";

export function resetKindFor(level: number, usedFreeResetAfter20: boolean): ResetKind {
  if (level <= 20) return "FREE_UNDER_21";
  if (!usedFreeResetAfter20) return "FREE_FIRST_AFTER_20";
  return "PAID";
}
