import type { Stats } from "@/game/combat/types";

export type RaceKey = "HUMAN" | "ELF" | "DWARF" | "ORC" | "HALFLING" | "DRAGONBORN";

export interface RaceDefinition {
  key: RaceKey;
  name: string;
  /** Modyfikatory sumują się do 0 (docs/gdd/00-glowny.md). */
  modifiers: Stats;
  trait: string;
}

export const RACES: Record<RaceKey, RaceDefinition> = {
  HUMAN: {
    key: "HUMAN",
    name: "Człowiek",
    modifiers: { strength: 0, dexterity: 0, vitality: 0, intellect: 0 },
    trait: "+1 dodatkowy punkt statystyk co 5 poziomów",
  },
  ELF: {
    key: "ELF",
    name: "Elf",
    modifiers: { strength: -2, dexterity: 2, vitality: -2, intellect: 2 },
    trait: "+10% skuteczności zaklęć",
  },
  DWARF: {
    key: "DWARF",
    name: "Krasnolud",
    modifiers: { strength: 1, dexterity: -2, vitality: 3, intellect: -2 },
    trait: "−15% kosztu i czasu budowy w twierdzy",
  },
  ORC: {
    key: "ORC",
    name: "Ork",
    modifiers: { strength: 3, dexterity: 0, vitality: 1, intellect: -4 },
    trait: "+10% obrażeń, gdy ma mniej niż 50% PŻ",
  },
  HALFLING: {
    key: "HALFLING",
    name: "Niziołek",
    modifiers: { strength: -3, dexterity: 3, vitality: 0, intellect: 0 },
    trait: "10% szansy na uniknięcie ciosu niezależnie od celności",
  },
  DRAGONBORN: {
    key: "DRAGONBORN",
    name: "Smokokrwisty",
    modifiers: { strength: 2, dexterity: -1, vitality: 1, intellect: -2 },
    trait: "raz na walkę zieje ogniem (obrażenia = 2× poziom)",
  },
};

/** Statystyki bazowe (10 w każdej) + modyfikator rasy. */
export function baseStatsForRace(raceKey: RaceKey): Stats {
  const mod = RACES[raceKey].modifiers;
  return {
    strength: 10 + mod.strength,
    dexterity: 10 + mod.dexterity,
    vitality: 10 + mod.vitality,
    intellect: 10 + mod.intellect,
  };
}
