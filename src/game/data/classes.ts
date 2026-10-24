import type { ClassKey, WeaponType } from "@/game/combat/types";

export interface ClassDefinition {
  key: ClassKey;
  name: string;
  mainStat: "strength" | "dexterity" | "vitality" | "intellect";
  weaponType: WeaponType;
  /** Mnożnik broni z docs/gdd/02-systemy-walki.md. */
  weaponMultiplier: number;
  /** Mnożnik pancerza z tej samej tabeli. */
  armorMultiplier: number;
  /** Liczba ataków bohatera na turę (Łotr ma 2). */
  attacksPerTurn: number;
  /** Opisy z docs/gdd/00-glowny.md, do ekranu tworzenia bohatera. */
  style: string;
  strongPoint: string;
  weakPoint: string;
}

export const CLASSES: Record<ClassKey, ClassDefinition> = {
  WARRIOR: {
    key: "WARRIOR",
    name: "Wojownik",
    mainStat: "strength",
    weaponType: "twoHanded",
    weaponMultiplier: 1.45,
    armorMultiplier: 1.0,
    attacksPerTurn: 1,
    style: "broń dwuręczna",
    strongPoint: "najwyższe obrażenia",
    weakPoint: "niska obrona",
  },
  PALADIN: {
    key: "PALADIN",
    name: "Paladyn",
    mainStat: "vitality",
    weaponType: "swordShield",
    weaponMultiplier: 0.65,
    armorMultiplier: 0.6,
    attacksPerTurn: 1,
    style: "miecz i tarcza",
    strongPoint: "blok 15% ciosów, leczy się raz na walkę",
    weakPoint: "wolne zabijanie",
  },
  ARCHER: {
    key: "ARCHER",
    name: "Łucznik",
    mainStat: "dexterity",
    weaponType: "bow",
    weaponMultiplier: 0.95,
    armorMultiplier: 0.8,
    attacksPerTurn: 1,
    style: "łuk",
    strongPoint: "1 darmowy strzał przed walką wręcz",
    weakPoint: "słabszy w zwarciu",
  },
  ROGUE: {
    key: "ROGUE",
    name: "Łotr",
    mainStat: "dexterity",
    weaponType: "daggers",
    weaponMultiplier: 0.55,
    armorMultiplier: 0.8,
    attacksPerTurn: 2,
    style: "dwa sztylety",
    strongPoint: "2 ataki na turę, krytyki",
    weakPoint: "mało punktów życia",
  },
  MAGE: {
    key: "MAGE",
    name: "Mag",
    mainStat: "intellect",
    weaponType: "spells",
    weaponMultiplier: 1.35,
    armorMultiplier: 0.6,
    attacksPerTurn: 1,
    style: "zaklęcia",
    strongPoint: "obrażenia ignorują pancerz",
    weakPoint: "najsłabszy pancerz",
  },
  PRIEST: {
    key: "PRIEST",
    name: "Kapłan",
    mainStat: "intellect",
    weaponType: "mace",
    weaponMultiplier: 0.75,
    armorMultiplier: 0.9,
    attacksPerTurn: 1,
    style: "buława i modlitwy",
    strongPoint: "leczenie co 3 tury, mocny przeciw nieumarłym",
    weakPoint: "niskie obrażenia",
  },
};

/**
 * Rozdanie punktów statystyk jak w metodologii testu balansu
 * (docs/gdd/15-balans.md): 2 punkty na poziom w statystykę główną, 1 w WYT.
 * Gdy statystyka główna to WYT (Paladyn), wszystkie 3 punkty idą w WYT.
 */
export function allocateStats(classKey: ClassKey, level: number) {
  const def = CLASSES[classKey];
  const stats = { strength: 10, dexterity: 10, vitality: 10, intellect: 10 };

  if (def.mainStat === "vitality") {
    stats.vitality += 3 * level;
    return stats;
  }

  stats[def.mainStat] += 2 * level;
  stats.vitality += 1 * level;
  return stats;
}
