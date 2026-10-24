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

const MAX_LEVEL = 120;

export interface LevelUpResult {
  level: number;
  experience: number;
  freePointsGained: number;
  levelsGained: number;
}

/** Dolicza PD, awansuje o tyle poziomów, na ile wystarczy PD, i liczy zdobyte punkty. */
export function applyExperience(
  currentLevel: number,
  currentExperience: number,
  raceKey: RaceKey,
  gainedXp: number,
): LevelUpResult {
  let level = currentLevel;
  let experience = currentExperience + gainedXp;
  let freePointsGained = 0;

  while (level < MAX_LEVEL) {
    const threshold = experienceToNextLevel(level);
    if (experience < threshold) break;
    experience -= threshold;
    level += 1;
    freePointsGained += 3 + (raceKey === "HUMAN" && level % 5 === 0 ? 1 : 0);
  }

  if (level >= MAX_LEVEL) experience = 0;

  return { level, experience, freePointsGained, levelsGained: level - currentLevel };
}
