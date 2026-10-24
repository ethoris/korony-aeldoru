import { CLASSES } from "@/game/data/classes";

import {
  CRIT_MULTIPLIER,
  attackPower,
  critChance,
  damageReduction,
  dexterityAdvantage,
  elementMultiplier,
  heroDefense,
  heroMaxHp,
  hitChance,
  initiative,
  monsterAttack,
  monsterDefense,
  monsterDexterity,
  monsterMaxHp,
  turnLimit,
} from "./formulas";
import { createRng, randomInt, randomRange, rollChance } from "./rng";
import type { Rng } from "./rng";
import type {
  AttackEvent,
  BattleEvent,
  BattleOutcome,
  BattleResult,
  CombatSide,
  Element,
  HeroConfig,
  MonsterConfig,
} from "./types";

interface AttackResolution {
  hit: boolean;
  crit: boolean;
  damage: number;
  element: Element;
  weakHit: boolean;
  resistHit: boolean;
}

function resolveAttack(
  rng: Rng,
  params: {
    attackerLevel: number;
    attackerDex: number;
    defenderLevel: number;
    defenderDex: number;
    attackPowerValue: number;
    defenseValue: number;
    ignoreDefense: boolean;
    element: Element;
    weakTo: readonly Element[];
    resistTo: readonly Element[];
  },
): AttackResolution {
  const dexAdv = dexterityAdvantage(params.attackerDex, params.defenderDex, params.attackerLevel, params.defenderLevel);
  const chance = hitChance(params.attackerLevel, params.defenderLevel, dexAdv);
  const hit = rollChance(rng, chance);

  if (!hit) {
    return { hit: false, crit: false, damage: 0, element: params.element, weakHit: false, resistHit: false };
  }

  const crit = rollChance(rng, critChance(params.attackerDex, params.attackerLevel));
  const reduction = params.ignoreDefense ? 0 : damageReduction(params.defenseValue, params.attackerLevel);
  const elementMult = elementMultiplier(params.element, params.weakTo as Element[], params.resistTo as Element[]);
  const variance = randomRange(rng, 0.85, 1.15);

  const raw = params.attackPowerValue * variance * (1 - reduction) * elementMult * (crit ? CRIT_MULTIPLIER : 1);
  const damage = Math.max(1, raw);

  return {
    hit: true,
    crit,
    damage,
    element: params.element,
    weakHit: elementMult > 1,
    resistHit: elementMult < 1,
  };
}

export function simulateBattle(hero: HeroConfig, monster: MonsterConfig, seed: number): BattleOutcome {
  const rng = createRng(seed);
  const classDef = CLASSES[hero.classKey];
  const tactic = hero.tactic ?? "BALANCED";

  const atkTacticMult = tactic === "AGGRESSIVE" ? 1.15 : tactic === "DEFENSIVE" ? 0.85 : 1;
  const defTacticMult = tactic === "AGGRESSIVE" ? 0.85 : tactic === "DEFENSIVE" ? 1.15 : 1;

  const mainStatValue = hero.stats[classDef.mainStat];
  const heroAttackPower = attackPower(hero.weaponDamage, mainStatValue) * atkTacticMult;
  const heroDefenseValue = heroDefense(hero.armorFromGear, hero.stats.vitality) * defTacticMult;
  const heroMaxHpValue = heroMaxHp(hero.stats.vitality, hero.level);
  const heroDex = hero.stats.dexterity;

  const monsterMaxHpValue = monsterMaxHp(monster.level, monster.isBoss);
  const monsterAtk = monsterAttack(monster.level, monster.isBoss);
  const monsterDef = monsterDefense(monster.level, monster.isBoss);
  const monsterDex = monsterDexterity(monster.level);

  let heroHp = heroMaxHpValue;
  let monsterHp = monsterMaxHpValue;

  const events: BattleEvent[] = [];
  let paladinHealUsed = false;

  const heroElement: Element = hero.classKey === "MAGE" ? hero.spellElement ?? "fire" : "physical";

  function heroAttacks(turn: number, attackIndex: number): BattleResult | null {
    const resolution = resolveAttack(rng, {
      attackerLevel: hero.level,
      attackerDex: heroDex,
      defenderLevel: monster.level,
      defenderDex: monsterDex,
      attackPowerValue: heroAttackPower,
      defenseValue: monsterDef,
      ignoreDefense: hero.classKey === "MAGE",
      element: heroElement,
      weakTo: monster.weakTo,
      resistTo: monster.resistTo,
    });

    if (resolution.hit) {
      monsterHp = Math.max(0, monsterHp - resolution.damage);
    }

    const event: AttackEvent = {
      kind: "attack",
      turn,
      actor: "hero",
      attackIndex,
      hit: resolution.hit,
      crit: resolution.crit,
      blocked: false,
      damage: resolution.hit ? resolution.damage : 0,
      element: resolution.element,
      weakHit: resolution.weakHit,
      resistHit: resolution.resistHit,
      targetHpAfter: monsterHp,
    };
    events.push(event);

    if (monsterHp <= 0) return "WIN";
    return null;
  }

  function monsterAttacks(turn: number): BattleResult | null {
    const resolution = resolveAttack(rng, {
      attackerLevel: monster.level,
      attackerDex: monsterDex,
      defenderLevel: hero.level,
      defenderDex: heroDex,
      attackPowerValue: monsterAtk,
      defenseValue: heroDefenseValue,
      ignoreDefense: false,
      element: "physical",
      weakTo: [],
      resistTo: [],
    });

    const blocked = Boolean(hero.hasShield) && resolution.hit && rollChance(rng, 0.15);
    const damage = blocked ? 0 : resolution.hit ? resolution.damage : 0;

    if (damage > 0) {
      heroHp = Math.max(0, heroHp - damage);
    }

    events.push({
      kind: "attack",
      turn,
      actor: "monster",
      attackIndex: 0,
      hit: resolution.hit,
      crit: resolution.crit,
      blocked,
      damage,
      element: resolution.element,
      weakHit: false,
      resistHit: false,
      targetHpAfter: heroHp,
    });

    if (heroHp <= 0) return "LOSE";

    if (hero.classKey === "PALADIN" && !paladinHealUsed && heroHp / heroMaxHpValue < 0.4) {
      const healAmount = Math.min(heroMaxHpValue - heroHp, heroMaxHpValue * 0.2);
      heroHp += healAmount;
      paladinHealUsed = true;
      events.push({ kind: "heal", turn, actor: "hero", amount: healAmount, targetHpAfter: heroHp });
    }

    if (tactic === "RETREAT_30" && heroHp / heroMaxHpValue < 0.3) {
      return "RETREAT";
    }

    return null;
  }

  function priestSelfHeal(turn: number): void {
    if (hero.classKey !== "PRIEST" || turn % 3 !== 0 || heroHp >= heroMaxHpValue) return;
    const healAmount = Math.min(heroMaxHpValue - heroHp, heroMaxHpValue * 0.15);
    if (healAmount <= 0) return;
    heroHp += healAmount;
    events.push({ kind: "heal", turn, actor: "hero", amount: healAmount, targetHpAfter: heroHp });
  }

  const limit = turnLimit(monster.isBoss);

  // Łucznik: 1 darmowy strzał przed walką, poza limitem tur.
  if (hero.classKey === "ARCHER") {
    const outcome = heroAttacks(0, 0);
    if (outcome === "WIN") {
      return finish("WIN", 0);
    }
  }

  const heroInit = initiative(heroDex, randomInt(rng, 1, 10));
  const monsterInit = initiative(monsterDex, randomInt(rng, 1, 10));
  const heroGoesFirst = heroInit >= monsterInit;

  let result: BattleResult | null = null;
  let turnsTaken = 0;

  for (let turn = 1; turn <= limit; turn++) {
    turnsTaken = turn;
    const order: CombatSide[] = heroGoesFirst ? ["hero", "monster"] : ["monster", "hero"];

    for (const side of order) {
      if (side === "hero") {
        for (let i = 0; i < classDef.attacksPerTurn; i++) {
          const outcome = heroAttacks(turn, i);
          if (outcome) {
            result = outcome;
            break;
          }
        }
        if (!result) priestSelfHeal(turn);
      } else {
        const outcome = monsterAttacks(turn);
        if (outcome) result = outcome;
      }

      if (result) break;
    }

    if (result) break;
  }

  if (!result) {
    result = "DRAW";
  }

  return finish(result, turnsTaken);

  function finish(finalResult: BattleResult, finalTurns: number): BattleOutcome {
    return {
      result: finalResult,
      turnsTaken: finalTurns,
      events,
      heroHpStart: heroMaxHpValue,
      heroHpEnd: heroHp,
      monsterHpStart: monsterMaxHpValue,
      monsterHpEnd: monsterHp,
    };
  }
}

export function toMonsterConfig(definition: {
  key: string;
  name: string;
  level: number;
  type: MonsterConfig["type"];
  isBoss: boolean;
  weakTo: Element[];
  resistTo: Element[];
}): MonsterConfig {
  return definition;
}
