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
  /** Dodatkowe PŻ z cechy +PŻ na ekwipunku (docs/gdd/08-ekwipunek.md). */
  bonusMaxHp?: number;
  /**
   * Do 3 wybranych zdolności (docs/gdd/02-systemy-walki.md, "Zdolności
   * klas"); zdolność z poziomu 1 jest dodawana automatycznie przez silnik.
   */
  selectedAbilities?: string[];
  /** Do 3 mikstur z pasa na tę wyprawę (docs/gdd/11-gospodarka-i-zadania.md). */
  selectedPotions?: string[];
  /** Procentowe cechy z ekwipunku (docs/gdd/08-ekwipunek.md, "Losowe cechy"). */
  gearDamagePercent?: number;
  gearCritPercent?: number;
  gearHitPercent?: number;
  gearBlockPercent?: number;
  /** Żywioł broni z cechy "żywiołu broni" (zamiast fizycznych obrażeń), gdy przedmiot ją ma. */
  gearWeaponElement?: Element;
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

export interface StatusEvent {
  kind: "status";
  turn: number;
  actor: CombatSide;
  text: string;
  targetHpAfter?: number;
}

export type BattleEvent = AttackEvent | HealEvent | StatusEvent;

export interface BattleOutcome {
  result: BattleResult;
  turnsTaken: number;
  events: BattleEvent[];
  heroHpStart: number;
  heroHpEnd: number;
  monsterHpStart: number;
  monsterHpEnd: number;
  /** Klucze mikstur bojowych faktycznie użytych w tej walce (do odliczenia z zapasów). */
  potionsConsumed: string[];
}
