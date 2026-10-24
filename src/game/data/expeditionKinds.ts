import type { ExpeditionKind } from "@/game/combat/types";

// docs/gdd/05-lokacje.md „Trzy rodzaje wyprawy” + docs/gdd/08-ekwipunek.md „Łupy”.
export interface ExpeditionKindDefinition {
  key: ExpeditionKind;
  name: string;
  timeMultiplier: number;
  fights: [number, number]; // [min, max] walk pod rząd
  lootChance: number;
  /** Zwiad: tylko zwykłe i magiczne przedmioty. */
  commonAndMagicOnly: boolean;
  goldMultiplier: number;
  /** Mnożnik szansy na rzadki/legendarny (kosztem zwykłego). */
  rareChanceMultiplier: number;
  /** Głęboka wyprawa: bez leczenia między walkami. */
  healBetweenFights: boolean;
}

export const EXPEDITION_KINDS: Record<ExpeditionKind, ExpeditionKindDefinition> = {
  SCOUT: {
    key: "SCOUT",
    name: "Zwiad",
    timeMultiplier: 0.5,
    fights: [1, 1],
    lootChance: 0.2,
    commonAndMagicOnly: true,
    goldMultiplier: 1,
    rareChanceMultiplier: 1,
    healBetweenFights: true,
  },
  HUNT: {
    key: "HUNT",
    name: "Polowanie",
    timeMultiplier: 1,
    fights: [1, 1],
    lootChance: 0.35,
    commonAndMagicOnly: false,
    goldMultiplier: 1,
    rareChanceMultiplier: 1,
    healBetweenFights: true,
  },
  DEEP: {
    key: "DEEP",
    name: "Głęboka wyprawa",
    timeMultiplier: 2,
    fights: [2, 3],
    lootChance: 0.35,
    commonAndMagicOnly: false,
    goldMultiplier: 1.5,
    rareChanceMultiplier: 2,
    healBetweenFights: false,
  },
  BOSS: {
    key: "BOSS",
    name: "Boss",
    timeMultiplier: 1,
    fights: [1, 1],
    lootChance: 1,
    commonAndMagicOnly: false,
    goldMultiplier: 1,
    rareChanceMultiplier: 1,
    healBetweenFights: true,
  },
};
