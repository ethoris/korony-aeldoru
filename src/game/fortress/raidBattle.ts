import type { UnitKey } from "@/game/data/units";
import { UNITS, UNIT_KEYS } from "@/game/data/units";

export type ArmyComposition = Partial<Record<UnitKey, number>>;

/** Typ jednostki z największą liczbą w armii (do bonusu przewagi atakującego). */
export function dominantUnitType(army: ArmyComposition): UnitKey | null {
  let best: UnitKey | null = null;
  let bestQty = 0;
  for (const key of UNIT_KEYS) {
    const qty = army[key] ?? 0;
    if (qty > bestQty) {
      best = key;
      bestQty = qty;
    }
  }
  return best;
}

/** Atak = Σ (atak jednostki · liczba · bonus przewagi +50%), docs/gdd/09-twierdza-i-wojna.md. */
export function attackerPower(attackerArmy: ArmyComposition, defenderArmy: ArmyComposition): number {
  const defenderDominant = dominantUnitType(defenderArmy);
  let total = 0;
  for (const key of UNIT_KEYS) {
    const qty = attackerArmy[key] ?? 0;
    if (qty <= 0) continue;
    const def = UNITS[key];
    const bonus = def.advantageOver === defenderDominant ? 1.5 : 1;
    total += def.attack * qty * bonus;
  }
  return total;
}

/** Obrona = Σ (obrona jednostki · liczba) × (1 + 5% × poziom Murów); garnizon prowincji jeszcze nie istnieje (wersja 4, mapa). */
export function defenderPower(defenderArmy: ArmyComposition, muryLevel: number): number {
  let total = 0;
  for (const key of UNIT_KEYS) {
    const qty = defenderArmy[key] ?? 0;
    if (qty <= 0) continue;
    total += UNITS[key].defense * qty;
  }
  return total * (1 + 0.05 * Math.max(0, muryLevel));
}

/** Ładowność łupu = Σ (ładowność jednostki · liczba wysłana, PO stratach). */
export function carryCapacity(army: ArmyComposition): number {
  let total = 0;
  for (const key of UNIT_KEYS) {
    const qty = army[key] ?? 0;
    if (qty <= 0) continue;
    total += UNITS[key].carryCapacity * qty;
  }
  return total;
}

export interface RaidBattleResult {
  attackerWins: boolean;
  attackerPower: number;
  defenderPower: number;
  /** Ułamek strat przegranego (zawsze 1 – traci wszystkie jednostki, które walczyły). */
  loserLossFraction: number;
  /** Ułamek strat zwycięzcy = (siła słabszego ÷ siła silniejszego)^1,5. */
  winnerLossFraction: number;
}

/**
 * Bitwa wojsk (docs/gdd/09-twierdza-i-wojna.md). ±10% losowości obu stron.
 * Uproszczenie: "przegrany traci wszystkie wysłane jednostki" stosujemy
 * symetrycznie do obu stron (przegrywający broniący też traci cały garnizon,
 * który walczył) – GDD nie precyzuje inaczej dla strony obronnej.
 */
export function resolveRaidBattle(
  attackerArmy: ArmyComposition,
  defenderArmy: ArmyComposition,
  muryLevel: number,
  attackerRandomFactor: number,
  defenderRandomFactor: number,
): RaidBattleResult {
  const rawAttacker = attackerPower(attackerArmy, defenderArmy);
  const rawDefender = defenderPower(defenderArmy, muryLevel);
  const atk = rawAttacker * attackerRandomFactor;
  const def = rawDefender * defenderRandomFactor;

  const attackerWins = atk > def;
  const stronger = Math.max(atk, def);
  const weaker = Math.min(atk, def);
  const winnerLossFraction = stronger > 0 ? Math.pow(weaker / stronger, 1.5) : 0;

  return {
    attackerWins,
    attackerPower: atk,
    defenderPower: def,
    loserLossFraction: 1,
    winnerLossFraction,
  };
}
