/**
 * Mikstury i sklep (docs/gdd/11-gospodarka-i-zadania.md). Cena = mnożnik ×
 * poziom bohatera. Mikstury COMBAT idą do pasa przed wyprawą (maks. 3,
 * docs/gdd/02-systemy-walki.md) i działają same w walce; mikstury INSTANT
 * używa się od razu, poza walką.
 */
export type PotionKind = "COMBAT" | "INSTANT";

export interface PotionDefinition {
  key: string;
  name: string;
  kind: PotionKind;
  priceMultiplier: number;
  effectText: string;
}

export const MAX_BELT_POTIONS = 3;
export const MAX_STAMINA_POTIONS_PER_DAY = 2;

export const POTIONS: Record<string, PotionDefinition> = {
  "mala-mikstura-zycia": {
    key: "mala-mikstura-zycia",
    name: "Mała mikstura życia",
    kind: "COMBAT",
    priceMultiplier: 5,
    effectText: "leczy 25% PŻ, gdy PŻ spada poniżej 35%",
  },
  "duza-mikstura-zycia": {
    key: "duza-mikstura-zycia",
    name: "Duża mikstura życia",
    kind: "COMBAT",
    priceMultiplier: 12,
    effectText: "leczy 50% PŻ, gdy PŻ spada poniżej 35%",
  },
  "eliksir-sily": {
    key: "eliksir-sily",
    name: "Eliksir siły",
    kind: "COMBAT",
    priceMultiplier: 10,
    effectText: "+15% ataku na całą walkę",
  },
  "eliksir-kamiennej-skory": {
    key: "eliksir-kamiennej-skory",
    name: "Eliksir kamiennej skóry",
    kind: "COMBAT",
    priceMultiplier: 10,
    effectText: "+20% obrony na całą walkę",
  },
  antidotum: {
    key: "antidotum",
    name: "Antidotum",
    kind: "COMBAT",
    priceMultiplier: 4,
    effectText: "zdejmuje truciznę i daje na nią odporność do końca walki",
  },
  "woda-swiecona": {
    key: "woda-swiecona",
    name: "Woda święcona",
    kind: "COMBAT",
    priceMultiplier: 6,
    effectText: "zdejmuje klątwę",
  },
  "mikstura-uzdrowienia": {
    key: "mikstura-uzdrowienia",
    name: "Mikstura uzdrowienia",
    kind: "INSTANT",
    priceMultiplier: 15,
    effectText: "leczy ranę od razu",
  },
  "napoj-wytrwalosci": {
    key: "napoj-wytrwalosci",
    name: "Napój wytrwałości",
    kind: "INSTANT",
    priceMultiplier: 20,
    effectText: `+30 wytrwałości, maks. ${MAX_STAMINA_POTIONS_PER_DAY} dziennie`,
  },
};

export function getPotion(key: string): PotionDefinition | undefined {
  return POTIONS[key];
}

export function combatPotionKeys(): string[] {
  return Object.values(POTIONS).filter((p) => p.kind === "COMBAT").map((p) => p.key);
}

export function priceFor(key: string, level: number): number {
  const potion = POTIONS[key];
  if (!potion) return 0;
  return potion.priceMultiplier * level;
}
