/** Jednostki wojska (docs/gdd/09-twierdza-i-wojna.md). Szkolone w Koszarach. */

export type UnitKey = "WLOCZNIK" | "LUCZNIK" | "RYCERZ" | "MAG_BITEWNY" | "TARAN";

export interface UnitCost {
  wood: number;
  iron: number;
  food: number;
  gold: number;
  mana?: number;
}

export interface UnitDefinition {
  key: UnitKey;
  name: string;
  koszaryLevelRequired: number;
  attack: number;
  defense: number;
  hp: number;
  cost: UnitCost;
  trainingMinutesPerUnit: number;
  foodPerHour: number;
  carryCapacity: number;
  /** Typ jednostki, nad którym ma przewagę +50% ataku (kamień-papier-nożyce), albo tekst specjalnej przewagi. */
  advantageOver: UnitKey | null;
  specialText: string | null;
}

export const UNITS: Record<UnitKey, UnitDefinition> = {
  WLOCZNIK: {
    key: "WLOCZNIK",
    name: "Włócznik",
    koszaryLevelRequired: 1,
    attack: 8,
    defense: 12,
    hp: 40,
    cost: { wood: 20, iron: 30, food: 20, gold: 5 },
    trainingMinutesPerUnit: 2,
    foodPerHour: 1,
    carryCapacity: 20,
    advantageOver: "RYCERZ",
    specialText: null,
  },
  LUCZNIK: {
    key: "LUCZNIK",
    name: "Łucznik",
    koszaryLevelRequired: 5,
    attack: 12,
    defense: 6,
    hp: 30,
    cost: { wood: 40, iron: 10, food: 20, gold: 10 },
    trainingMinutesPerUnit: 3,
    foodPerHour: 1,
    carryCapacity: 10,
    advantageOver: "WLOCZNIK",
    specialText: null,
  },
  RYCERZ: {
    key: "RYCERZ",
    name: "Rycerz",
    koszaryLevelRequired: 10,
    attack: 20,
    defense: 18,
    hp: 80,
    cost: { wood: 30, iron: 80, food: 50, gold: 40 },
    trainingMinutesPerUnit: 8,
    foodPerHour: 3,
    carryCapacity: 40,
    advantageOver: "LUCZNIK",
    specialText: null,
  },
  MAG_BITEWNY: {
    key: "MAG_BITEWNY",
    name: "Mag bitewny",
    koszaryLevelRequired: 15,
    attack: 30,
    defense: 6,
    hp: 40,
    cost: { wood: 20, iron: 20, food: 40, gold: 100, mana: 20 },
    trainingMinutesPerUnit: 12,
    foodPerHour: 2,
    carryCapacity: 5,
    advantageOver: null,
    specialText: "ignoruje 50% bonusu murów",
  },
  TARAN: {
    key: "TARAN",
    name: "Taran",
    koszaryLevelRequired: 20,
    attack: 5,
    defense: 10,
    hp: 200,
    cost: { wood: 200, iron: 100, food: 0, gold: 80 },
    trainingMinutesPerUnit: 20,
    foodPerHour: 4,
    carryCapacity: 0,
    advantageOver: null,
    specialText: "mury: −1 poziom muru za każde 10 taranów",
  },
};

export const UNIT_KEYS = Object.keys(UNITS) as UnitKey[];

/** Limit wojska = 50 × poziom Koszar (docs/gdd/09-twierdza-i-wojna.md). */
export function armyLimit(koszaryLevel: number): number {
  return 50 * Math.max(0, koszaryLevel);
}
