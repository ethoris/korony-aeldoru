export const MAX_STAMINA = 100;
const REGEN_MINUTES_PER_POINT = 3;
const REGEN_MS_PER_POINT = REGEN_MINUTES_PER_POINT * 60 * 1000;

export interface StaminaState {
  stamina: number;
  staminaUpdatedAt: Date;
}

/** Wytrwałość odnawia się o 1 co 3 minuty (docs/gdd/00-glowny.md), maks. 100. */
export function regenerateStamina(current: StaminaState, now: Date): StaminaState {
  if (current.stamina >= MAX_STAMINA) {
    return { stamina: current.stamina, staminaUpdatedAt: current.staminaUpdatedAt };
  }

  const elapsedMs = now.getTime() - current.staminaUpdatedAt.getTime();
  const pointsGained = Math.floor(elapsedMs / REGEN_MS_PER_POINT);
  if (pointsGained <= 0) {
    return { stamina: current.stamina, staminaUpdatedAt: current.staminaUpdatedAt };
  }

  const stamina = Math.min(MAX_STAMINA, current.stamina + pointsGained);
  // Nie gubimy "resztki" czasu, gdy nie trafiliśmy w sufit 100.
  const staminaUpdatedAt =
    stamina === MAX_STAMINA ? now : new Date(current.staminaUpdatedAt.getTime() + pointsGained * REGEN_MS_PER_POINT);

  return { stamina, staminaUpdatedAt };
}
