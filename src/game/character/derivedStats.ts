import { critChance, heroDefense, heroMaxHp } from "@/game/combat/formulas";
import type { Stats } from "@/game/combat/types";

export interface DerivedStats {
  maxHp: number;
  /** Obrona bez ekwipunku (pancerz 0 + WYT/2) – ekwipunek przyjdzie w kroku 5. */
  defenseNoGear: number;
  critChancePct: number;
}

export function computeDerivedStats(stats: Stats, level: number): DerivedStats {
  return {
    maxHp: heroMaxHp(stats.vitality, level),
    defenseNoGear: heroDefense(0, stats.vitality),
    critChancePct: critChance(stats.dexterity, level) * 100,
  };
}
