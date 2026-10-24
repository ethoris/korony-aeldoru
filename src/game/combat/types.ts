export type ClassKey = "WARRIOR" | "PALADIN" | "ARCHER" | "ROGUE" | "MAGE" | "PRIEST";

export type Element = "physical" | "fire" | "ice" | "lightning" | "light" | "shadow" | "poison";

export type WeaponType = "twoHanded" | "swordShield" | "bow" | "daggers" | "spells" | "mace";

export type MonsterType =
  | "animal"
  | "humanoid"
  | "undead"
  | "giant"
  | "beast"
  | "construct"
  | "elemental"
  | "demon"
  | "dragon";

export type Tactic = "AGGRESSIVE" | "BALANCED" | "DEFENSIVE" | "RETREAT_30";

export type ExpeditionKind = "SCOUT" | "HUNT" | "DEEP" | "BOSS";

export interface Stats {
  strength: number;
  dexterity: number;
  vitality: number;
  intellect: number;
}

export interface HeroConfig {
  classKey: ClassKey;
  level: number;
  stats: Stats;
  /** Średnie obrażenia broni (po mnożniku typu i jakości), przed mnożnikiem SIŁ/ZRE/INT z Ataku. */
  weaponDamage: number;
  /** Suma pancerza z ekwipunku (bez WYT/2, to liczy silnik). */
  armorFromGear: number;
  tactic?: Tactic;
  /** Żywioł zaklęć Maga (ignorowany dla innych klas). */
  spellElement?: Element;
  /** Czy Paladyn ma tarczę (blok 15% ciosów). */
  hasShield?: boolean;
  /**
   * PŻ na start walki, gdy inne niż pełne (głęboka wyprawa: „bez leczenia
   * między walkami” z docs/gdd/05-lokacje.md – HP przechodzi z poprzedniej walki).
   */
  startingHpOverride?: number;
}

export interface MonsterConfig {
  key: string;
  name: string;
  level: number;
  type: MonsterType;
  isBoss: boolean;
  weakTo: Element[];
  resistTo: Element[];
}

export type CombatSide = "hero" | "monster";

export type BattleResult = "WIN" | "LOSE" | "DRAW" | "RETREAT";

export interface AttackEvent {
  kind: "attack";
  turn: number;
  actor: CombatSide;
  attackIndex: number; // 0-based, dla klas z wieloma atakami na turę (Łotr, darmowy strzał Łucznika)
  hit: boolean;
  crit: boolean;
  blocked: boolean;
  damage: number;
  element: Element;
  weakHit: boolean;
  resistHit: boolean;
  targetHpAfter: number;
}

export interface HealEvent {
  kind: "heal";
  turn: number;
  actor: CombatSide;
  amount: number;
  targetHpAfter: number;
}

export type BattleEvent = AttackEvent | HealEvent;

export interface BattleOutcome {
  result: BattleResult;
  turnsTaken: number;
  events: BattleEvent[];
  heroHpStart: number;
  heroHpEnd: number;
  monsterHpStart: number;
  monsterHpEnd: number;
}
