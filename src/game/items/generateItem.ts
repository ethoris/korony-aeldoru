import { computeArmorTotal, computeShieldArmor, computeWeaponDamage, QUALITY_MULTIPLIER } from "@/game/combat/equipment";
import type { Rng } from "@/game/combat/rng";
import { randomInt, rollChance } from "@/game/combat/rng";
import type { ClassKey, Element } from "@/game/combat/types";
import { CLASSES } from "@/game/data/classes";
import type { ExpeditionKindDefinition } from "@/game/data/expeditionKinds";
import { ELEMENTAL_AFFIX_WORDS, ELEMENT_RESIST_AFFIX_WORDS, affixesForSlot } from "@/game/data/itemAffixes";
import type { AffixDefinition } from "@/game/data/itemAffixes";

import type { GeneratedItem, ItemAffixInstance, ItemQuality, ItemSlot } from "./types";

const ARMOR_SLOT_SHARE: Record<string, number> = { ARMOR: 0.45, HELMET: 0.2, BOOTS: 0.2, GLOVES: 0.15 };

const BASE_NOUN_BY_WEAPON_TYPE: Record<string, string> = {
  twoHanded: "Topór",
  swordShield: "Miecz",
  bow: "Łuk",
  daggers: "Sztylet",
  spells: "Kostur",
  mace: "Buława",
};

const BASE_NOUN_BY_SLOT: Record<ItemSlot, string> = {
  WEAPON: "Broń",
  OFFHAND: "Tarcza",
  HELMET: "Hełm",
  ARMOR: "Zbroja",
  GLOVES: "Rękawice",
  BOOTS: "Buty",
  AMULET: "Amulet",
  RING: "Pierścień",
};

const CASTABLE_ELEMENTS: Element[] = ["fire", "ice", "lightning"];

const GEAR_SLOT_WEIGHTS: Array<[ItemSlot, number]> = [
  ["WEAPON", 15],
  ["OFFHAND", 10],
  ["HELMET", 12],
  ["ARMOR", 12],
  ["GLOVES", 12],
  ["BOOTS", 12],
  ["AMULET", 8],
  ["RING", 8],
];
const POTION_WEIGHT = 11; // "mikstura zamiast przedmiotu" – patrz forceItem poniżej.
const GEAR_WEIGHT_TOTAL = GEAR_SLOT_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);

/**
 * Slot = 100%: 8 slotów ekwipunku wg wag z docs/gdd/08-ekwipunek.md + 11%
 * "mikstura zamiast przedmiotu" (zwraca null – w wersji 1 nie mamy jeszcze
 * mikstur w plecaku, patrz podsumowanie kroku). `forceItem` (bossowie:
 * gwarantowany łup) wyklucza ten wynik i rozkłada 11% na pozostałe sloty.
 */
function rollSlotOrPotion(rng: Rng, forceItem: boolean): ItemSlot | "POTION" {
  const total = forceItem ? GEAR_WEIGHT_TOTAL : GEAR_WEIGHT_TOTAL + POTION_WEIGHT;
  const roll = rng() * total;
  let acc = 0;
  for (const [slot, weight] of GEAR_SLOT_WEIGHTS) {
    acc += weight;
    if (roll < acc) return slot;
  }
  return "POTION";
}

function rollQuality(rng: Rng, kind: ExpeditionKindDefinition, scoutOnly: boolean): ItemQuality {
  const magic = 22;
  let rare = 6.5 * kind.rareChanceMultiplier;
  let legendary = 1.5 * kind.rareChanceMultiplier;

  if (scoutOnly) {
    rare = 0;
    legendary = 0;
  }

  const roll = rng() * 100;

  if (roll < legendary) return "LEGENDARY";
  if (roll < legendary + rare) return "RARE";
  if (roll < legendary + rare + magic) return "MAGIC";
  return "COMMON";
}

function affixCountForQuality(quality: ItemQuality): number {
  switch (quality) {
    case "MAGIC":
      return 1;
    case "RARE":
      return 2;
    case "LEGENDARY":
      return 3;
    default:
      return 0;
  }
}

function pickRandomDistinct<T>(rng: Rng, items: T[], count: number): T[] {
  const pool = [...items];
  const picked: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const index = Math.floor(rng() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

function rollAffixValue(def: AffixDefinition, level: number, rng: Rng): number {
  const min = def.min(level);
  const max = Math.max(min, def.max(level));
  const value = randomInt(rng, min, max);
  return def.cap ? Math.min(value, def.cap) : value;
}

export interface GenerateItemParams {
  rng: Rng;
  monsterLevel: number;
  playerClass: ClassKey;
  kind: ExpeditionKindDefinition;
  guaranteedMinQuality?: ItemQuality;
  /** Bossowie: gwarantowany przedmiot, nigdy "wypadła mikstura". */
  forceItem?: boolean;
}

/** Losuje łup po wygranej walce; null = brak przedmiotu (w tym "wypadła mikstura"). */
export function generateLoot(params: GenerateItemParams): GeneratedItem | null {
  const { rng, monsterLevel, playerClass, kind } = params;

  const slot = rollSlotOrPotion(rng, Boolean(params.forceItem));
  if (slot === "POTION") return null;

  let quality = rollQuality(rng, kind, kind.commonAndMagicOnly);
  if (params.guaranteedMinQuality) {
    const order: ItemQuality[] = ["COMMON", "MAGIC", "RARE", "LEGENDARY"];
    if (order.indexOf(quality) < order.indexOf(params.guaranteedMinQuality)) {
      quality = params.guaranteedMinQuality;
    }
  }

  const itemLevel = Math.min(100, Math.max(1, monsterLevel + randomInt(rng, -2, 2)));
  const forClass = rollChance(rng, 0.7) ? playerClass : (Object.keys(CLASSES)[Math.floor(rng() * 6)] as ClassKey);
  const classDef = CLASSES[forClass];

  const affixDefs = pickRandomDistinct(rng, affixesForSlot(slot), affixCountForQuality(quality));
  const affixes: ItemAffixInstance[] = affixDefs.map((def) => {
    const instance: ItemAffixInstance = {
      key: def.key,
      value: rollAffixValue(def, itemLevel, rng),
      label: def.affixWord,
    };
    if (def.key === "elementalWeaponDamagePercent" || def.key === "elementResistPercent") {
      instance.element = CASTABLE_ELEMENTS[Math.floor(rng() * CASTABLE_ELEMENTS.length)];
      instance.label = def.key === "elementalWeaponDamagePercent" ? ELEMENTAL_AFFIX_WORDS[instance.element] : ELEMENT_RESIST_AFFIX_WORDS[instance.element];
    }
    return instance;
  });

  const elementalAffix = affixes.find((a) => a.key === "elementalWeaponDamagePercent");
  const elementalWord = elementalAffix?.label ?? "";

  let damageMin: number | undefined;
  let damageMax: number | undefined;
  let armor: number | undefined;

  if (slot === "WEAPON") {
    const avg = computeWeaponDamage(forClass, itemLevel, quality);
    damageMin = Math.round(avg * 0.85);
    damageMax = Math.round(avg * 1.15);
  } else if (slot === "OFFHAND" && forClass === "PALADIN") {
    armor = Math.round(computeShieldArmor(itemLevel, quality));
  } else if (slot in ARMOR_SLOT_SHARE) {
    armor = Math.round(computeArmorTotal(forClass, itemLevel, quality) * ARMOR_SLOT_SHARE[slot]);
  }

  const suffixAffix = affixes.find((a) => a.key !== "elementalWeaponDamagePercent");
  const baseNoun = slot === "WEAPON" ? BASE_NOUN_BY_WEAPON_TYPE[classDef.weaponType] : BASE_NOUN_BY_SLOT[slot];
  const nameParts = [elementalWord, baseNoun, suffixAffix?.label].filter(Boolean);

  return {
    slot,
    level: itemLevel,
    quality,
    name: nameParts.join(" "),
    damageMin,
    damageMax,
    armor,
    affixes,
    forClass,
  };
}

export { QUALITY_MULTIPLIER, ELEMENT_RESIST_AFFIX_WORDS };
