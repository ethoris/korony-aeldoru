import type { Element } from "@/game/combat/types";
import type { ItemSlot } from "@/game/items/types";

// docs/gdd/08-ekwipunek.md „Losowe cechy”. P = poziom przedmiotu.
export type AffixKey =
  | "strength"
  | "dexterity"
  | "vitality"
  | "intellect"
  | "maxHp"
  | "damagePercent"
  | "critPercent"
  | "hitPercent"
  | "blockPercent"
  | "elementResistPercent"
  | "goldFromExpeditionsPercent"
  | "experiencePercent"
  | "expeditionTimeReductionPercent"
  | "elementalWeaponDamagePercent";

export interface AffixDefinition {
  key: AffixKey;
  affixWord: string;
  eligibleSlots: ItemSlot[];
  min: (level: number) => number;
  max: (level: number) => number;
  /** Limit z ekwipunku łącznie (różne od zakresu jednego losowania). */
  cap?: number;
}

const ALL_SLOTS: ItemSlot[] = ["WEAPON", "OFFHAND", "HELMET", "ARMOR", "GLOVES", "BOOTS", "AMULET", "RING"];
const GEAR_WITH_AFFIX_SLOTS: ItemSlot[] = ["WEAPON", "GLOVES", "RING"];

export const AFFIXES: Record<AffixKey, AffixDefinition> = {
  strength: { key: "strength", affixWord: "Niedźwiedzia", eligibleSlots: ALL_SLOTS, min: () => 1, max: (p) => 2 + Math.floor(p / 5) },
  dexterity: { key: "dexterity", affixWord: "Rysia", eligibleSlots: ALL_SLOTS, min: () => 1, max: (p) => 2 + Math.floor(p / 5) },
  vitality: { key: "vitality", affixWord: "Dębu", eligibleSlots: ALL_SLOTS, min: () => 1, max: (p) => 2 + Math.floor(p / 5) },
  intellect: { key: "intellect", affixWord: "Sowy", eligibleSlots: ALL_SLOTS, min: () => 1, max: (p) => 2 + Math.floor(p / 5) },
  maxHp: {
    key: "maxHp",
    affixWord: "Żywotny",
    eligibleSlots: ["ARMOR", "HELMET", "AMULET"],
    min: () => 5,
    max: (p) => 10 + 3 * p,
  },
  damagePercent: { key: "damagePercent", affixWord: "Ostry", eligibleSlots: GEAR_WITH_AFFIX_SLOTS, min: () => 2, max: () => 8 },
  critPercent: { key: "critPercent", affixWord: "Zabójczy", eligibleSlots: GEAR_WITH_AFFIX_SLOTS, min: () => 1, max: () => 4, cap: 10 },
  hitPercent: { key: "hitPercent", affixWord: "Celny", eligibleSlots: ["WEAPON", "HELMET"], min: () => 1, max: () => 5 },
  blockPercent: { key: "blockPercent", affixWord: "Niezłomny", eligibleSlots: ["OFFHAND"], min: () => 2, max: () => 6 },
  elementResistPercent: {
    key: "elementResistPercent",
    affixWord: "odporność żywiołu",
    eligibleSlots: ["ARMOR", "AMULET", "RING", "OFFHAND"],
    min: () => 5,
    max: () => 15,
    cap: 40,
  },
  goldFromExpeditionsPercent: {
    key: "goldFromExpeditionsPercent",
    affixWord: "Szczęścia",
    eligibleSlots: ["AMULET", "RING", "BOOTS"],
    min: () => 3,
    max: () => 10,
    cap: 30,
  },
  experiencePercent: { key: "experiencePercent", affixWord: "Mędrca", eligibleSlots: ["AMULET", "HELMET"], min: () => 2, max: () => 6 },
  expeditionTimeReductionPercent: {
    key: "expeditionTimeReductionPercent",
    affixWord: "Wędrowca",
    eligibleSlots: ["BOOTS"],
    min: () => 3,
    max: () => 8,
    cap: 15,
  },
  elementalWeaponDamagePercent: {
    key: "elementalWeaponDamagePercent",
    affixWord: "żywiołu broni",
    eligibleSlots: ["WEAPON"],
    min: () => 5,
    max: () => 15,
  },
};

export const ELEMENTAL_AFFIX_WORDS: Record<Element, string> = {
  physical: "",
  fire: "Ognisty",
  ice: "Lodowy",
  lightning: "Gromowy",
  light: "Święty",
  shadow: "Mroczny",
  poison: "Jadowity",
};

export const ELEMENT_RESIST_AFFIX_WORDS: Record<Element, string> = {
  physical: "",
  fire: "Ognioodporny",
  ice: "Mroźny",
  lightning: "Odgromowy",
  light: "Jasny",
  shadow: "Cienisty",
  poison: "Odtruty",
};

export function affixesForSlot(slot: ItemSlot): AffixDefinition[] {
  return Object.values(AFFIXES).filter((a) => a.eligibleSlots.includes(slot));
}
