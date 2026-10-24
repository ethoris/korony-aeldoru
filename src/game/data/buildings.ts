/** Budynki twierdzy (docs/gdd/09-twierdza-i-wojna.md, docs/gdd/00-glowny.md). */

export type BuildingKey =
  | "RATUSZ"
  | "TARTAK"
  | "KAMIENIOLOM"
  | "KOPALNIA"
  | "FARMA"
  | "MAGAZYN"
  | "KUZNIA"
  | "SWIATYNIA"
  | "WIEZA_MAGOW"
  | "KOSZARY"
  | "MURY"
  | "TARGOWISKO";

export type ResourceKey = "wood" | "stone" | "iron" | "food" | "mana";

export interface BuildingCost {
  wood: number;
  stone: number;
  iron: number;
  gold: number;
}

export interface BuildingDefinition {
  key: BuildingKey;
  name: string;
  baseCost: BuildingCost;
  baseTimeMinutes: number;
  maxLevel: number;
  /** Surowiec, który budynek produkuje tym samym wzorem produkcji (brak = budynek niczego nie produkuje). */
  producesResource?: ResourceKey;
}

export const MAX_BUILDING_LEVEL = 20;

export const BUILDINGS: Record<BuildingKey, BuildingDefinition> = {
  RATUSZ: {
    key: "RATUSZ",
    name: "Ratusz",
    baseCost: { wood: 120, stone: 120, iron: 40, gold: 50 },
    baseTimeMinutes: 10,
    maxLevel: MAX_BUILDING_LEVEL,
  },
  TARTAK: {
    key: "TARTAK",
    name: "Tartak",
    baseCost: { wood: 40, stone: 30, iron: 0, gold: 0 },
    baseTimeMinutes: 3,
    maxLevel: MAX_BUILDING_LEVEL,
    producesResource: "wood",
  },
  KAMIENIOLOM: {
    key: "KAMIENIOLOM",
    name: "Kamieniołom",
    baseCost: { wood: 50, stone: 20, iron: 0, gold: 0 },
    baseTimeMinutes: 3,
    maxLevel: MAX_BUILDING_LEVEL,
    producesResource: "stone",
  },
  KOPALNIA: {
    key: "KOPALNIA",
    name: "Kopalnia",
    baseCost: { wood: 60, stone: 50, iron: 0, gold: 0 },
    baseTimeMinutes: 4,
    maxLevel: MAX_BUILDING_LEVEL,
    producesResource: "iron",
  },
  FARMA: {
    key: "FARMA",
    name: "Farma",
    baseCost: { wood: 40, stone: 20, iron: 0, gold: 0 },
    baseTimeMinutes: 3,
    maxLevel: MAX_BUILDING_LEVEL,
    producesResource: "food",
  },
  MAGAZYN: {
    key: "MAGAZYN",
    name: "Magazyn",
    baseCost: { wood: 60, stone: 60, iron: 10, gold: 0 },
    baseTimeMinutes: 4,
    maxLevel: MAX_BUILDING_LEVEL,
  },
  KUZNIA: {
    key: "KUZNIA",
    name: "Kuźnia",
    baseCost: { wood: 80, stone: 100, iron: 60, gold: 40 },
    baseTimeMinutes: 8,
    maxLevel: MAX_BUILDING_LEVEL,
  },
  SWIATYNIA: {
    key: "SWIATYNIA",
    name: "Świątynia",
    baseCost: { wood: 90, stone: 120, iron: 20, gold: 80 },
    baseTimeMinutes: 8,
    maxLevel: MAX_BUILDING_LEVEL,
  },
  WIEZA_MAGOW: {
    key: "WIEZA_MAGOW",
    name: "Wieża Magów",
    baseCost: { wood: 100, stone: 150, iron: 80, gold: 120 },
    baseTimeMinutes: 12,
    maxLevel: MAX_BUILDING_LEVEL,
    producesResource: "mana",
  },
  KOSZARY: {
    key: "KOSZARY",
    name: "Koszary",
    baseCost: { wood: 100, stone: 80, iron: 60, gold: 40 },
    baseTimeMinutes: 8,
    maxLevel: MAX_BUILDING_LEVEL,
  },
  MURY: {
    key: "MURY",
    name: "Mury",
    baseCost: { wood: 80, stone: 160, iron: 40, gold: 0 },
    baseTimeMinutes: 6,
    maxLevel: MAX_BUILDING_LEVEL,
  },
  TARGOWISKO: {
    key: "TARGOWISKO",
    name: "Targowisko",
    baseCost: { wood: 100, stone: 60, iron: 20, gold: 60 },
    baseTimeMinutes: 6,
    maxLevel: MAX_BUILDING_LEVEL,
  },
};

export const BUILDING_KEYS = Object.keys(BUILDINGS) as BuildingKey[];

/** Poziom bohatera wymagany do założenia twierdzy (docs/gdd/00-glowny.md). */
export const FORTRESS_UNLOCK_LEVEL = 5;

/**
 * GDD nie opisuje, jak gracz dostaje pierwsze surowce na Ratusz poz. 1 (bez
 * budynków produkcja = 0, start byłby niemożliwy) – decyzja Patryka: Ratusz
 * startuje od poziomu 1 za darmo, plus mały pakiet surowców na pierwsze
 * budynki produkcyjne.
 */
export const FORTRESS_STARTER_RATUSZ_LEVEL = 1;
export const FORTRESS_STARTER_RESOURCES = { wood: 200, stone: 200, iron: 100, food: 0, mana: 0 } as const;

/** Nowi gracze mają 7 dni ochrony przed napadami (docs/gdd/00-glowny.md). */
export const FORTRESS_PROTECTION_DAYS = 7;
