import type { RaceKey } from "@/game/data/races";

/** PD na kolejny poziom = 34 · poziom^1,7 (docs/gdd/00-glowny.md, 15-balans.md). */
export function experienceToNextLevel(level: number): number {
  return Math.round(34 * Math.pow(level, 1.7));
}

/**
 * Suma punktów statystyk zdobytych od poziomu 1 do `level` (3 na poziom,
 * plus +1 co 5 poziomów dla Człowieka) – używana przy resecie, który
 * oddaje wszystkie punkty do nowego rozdania.
 */
export function totalFreePointsEarned(level: number, raceKey: RaceKey): number {
  const base = 3 * (level - 1);
  const humanBonus = raceKey === "HUMAN" ? Math.floor(level / 5) : 0;
  return base + humanBonus;
}
