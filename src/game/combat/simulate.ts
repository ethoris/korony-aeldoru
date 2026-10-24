import { CLASSES } from "@/game/data/classes";

import { AbilityRuntime } from "./abilityEngine";
import { PotionRuntime } from "./potionEngine";
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

export function resolveAttack(
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
    forceHit?: boolean;
    forceCrit?: boolean;
    ignoreResist?: boolean;
    /** Procentowe cechy ekwipunku (docs/gdd/08-ekwipunek.md); tylko dla ciosów bohatera. */
    gearHitBonus?: number;
    gearCritBonus?: number;
  },
): AttackResolution {
  const dexAdv = dexterityAdvantage(params.attackerDex, params.defenderDex, params.attackerLevel, params.defenderLevel);
  const chance = Math.min(0.95, hitChance(params.attackerLevel, params.defenderLevel, dexAdv) + (params.gearHitBonus ?? 0) / 100);
  const hit = params.forceHit ? true : rollChance(rng, chance);

  if (!hit) {
    return { hit: false, crit: false, damage: 0, element: params.element, weakHit: false, resistHit: false };
  }

  const critChanceValue = critChance(params.attackerDex, params.attackerLevel) + (params.gearCritBonus ?? 0) / 100;
  const crit = params.forceCrit ? true : rollChance(rng, critChanceValue);
  const reduction = params.ignoreDefense ? 0 : damageReduction(params.defenseValue, params.attackerLevel);
  let elementMult = elementMultiplier(params.element, params.weakTo as Element[], params.resistTo as Element[]);
  if (params.ignoreResist && elementMult < 1) elementMult = 1;
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
  const abilities = new AbilityRuntime(hero.classKey, hero.level, hero.selectedAbilities ?? []);
  const potions = new PotionRuntime(hero.selectedPotions ?? [], monster.isBoss);
  const healMult = 1 + (hero.healBonusPercent ?? 0) / 100;

  const atkTacticMult = tactic === "AGGRESSIVE" ? 1.15 : tactic === "DEFENSIVE" ? 0.85 : 1;
  const defTacticMult = tactic === "AGGRESSIVE" ? 0.85 : tactic === "DEFENSIVE" ? 1.15 : 1;

  const mainStatValue = hero.stats[classDef.mainStat];
  const heroAttackPower =
    attackPower(hero.weaponDamage, mainStatValue) *
    atkTacticMult *
    (1 + (hero.gearDamagePercent ?? 0) / 100) *
    (1 + potions.atkBonus() / 100);
  const heroDefenseValue =
    heroDefense(hero.armorFromGear, hero.stats.vitality) *
    defTacticMult *
    (1 + potions.defBonus() / 100) *
    (1 + (hero.gearArmorPercent ?? 0) / 100);
  const heroMaxHpValue = heroMaxHp(hero.stats.vitality, hero.level) + (hero.bonusMaxHp ?? 0);
  const heroDex = hero.stats.dexterity;

  const monsterMaxHpValue = monsterMaxHp(monster.level, monster.isBoss);
  const monsterAtk = monsterAttack(monster.level, monster.isBoss);
  const monsterDef = monsterDefense(monster.level, monster.isBoss);
  const monsterDex = monsterDexterity(monster.level);

  let heroHp =
    hero.startingHpOverride !== undefined
      ? Math.min(heroMaxHpValue, Math.max(1, hero.startingHpOverride))
      : heroMaxHpValue;
  const heroHpAtStart = heroHp;
  let monsterHp = monsterMaxHpValue;

  const events: BattleEvent[] = [];
  let paladinHealUsed = false;

  const heroElement: Element =
    hero.classKey === "MAGE" ? hero.spellElement ?? "fire" : hero.gearWeaponElement ?? "physical";

  function pushStatus(turn: number, actor: CombatSide, text: string, targetHpAfter?: number): void {
    events.push({ kind: "status", turn, actor, text, targetHpAfter });
  }

  function heroAttacks(turn: number, attackIndex: number, multiplier: number, overrides: {
    element?: Element;
    ignoreDefense?: boolean;
    defensePierce?: number;
    ignoreResist?: boolean;
    forceHit?: boolean;
    forceCrit?: boolean;
  } = {}): BattleResult | null {
    const buff = abilities.attackPowerMultiplier();
    const effectiveDefense = monsterDef * (1 - (overrides.defensePierce ?? 0));

    const resolution = resolveAttack(rng, {
      attackerLevel: hero.level,
      attackerDex: heroDex,
      defenderLevel: monster.level,
      defenderDex: monsterDex,
      attackPowerValue: heroAttackPower * multiplier * buff.mult,
      defenseValue: effectiveDefense,
      ignoreDefense: Boolean(overrides.ignoreDefense) || hero.classKey === "MAGE",
      element: overrides.element ?? buff.element ?? heroElement,
      weakTo: monster.weakTo,
      resistTo: monster.resistTo,
      forceHit: overrides.forceHit,
      forceCrit: overrides.forceCrit,
      ignoreResist: overrides.ignoreResist,
      gearHitBonus: hero.gearHitPercent,
      gearCritBonus: hero.gearCritPercent,
    });

    if (resolution.hit) {
      monsterHp = Math.max(0, monsterHp - resolution.damage);
      abilities.onHeroHitLands();
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
    const skipLine = abilities.monsterSkipsTurn();
    if (skipLine) {
      pushStatus(turn, "monster", skipLine);
      return null;
    }

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

    const blockChance = (hero.hasShield ? 0.15 : 0) + abilities.extraBlockChance() + (hero.gearBlockPercent ?? 0) / 100;
    const blocked = blockChance > 0 && resolution.hit && rollChance(rng, blockChance);
    const dodged = !blocked && resolution.hit && abilities.rollExtraDodge(rng);

    let damage = blocked || dodged ? 0 : resolution.hit ? resolution.damage : 0;
    let absorbStatus: string | null = null;

    if (damage > 0) {
      const { reductionPct } = abilities.incomingDamageModifiers(monster.type);
      damage *= 1 - reductionPct;
      const absorbed = abilities.absorbDamage(damage);
      damage = absorbed.damage;
      absorbStatus = absorbed.statusLine;
    }

    if (resolution.hit && !blocked && !dodged) {
      abilities.onHeroHitByMonster();
    }

    if (damage > 0) {
      heroHp = Math.max(0, heroHp - damage);
    }

    events.push({
      kind: "attack",
      turn,
      actor: "monster",
      attackIndex: 0,
      hit: resolution.hit && !dodged,
      crit: resolution.crit,
      blocked,
      damage,
      element: resolution.element,
      weakHit: false,
      resistHit: false,
      targetHpAfter: heroHp,
    });

    if (absorbStatus) pushStatus(turn, "hero", absorbStatus, heroHp);

    if (heroHp <= 0) {
      if (abilities.tryResurrect()) {
        heroHp = Math.round(heroMaxHpValue * 0.3);
        pushStatus(turn, "hero", "Bohater wraca do życia dzięki Wskrzeszeniu!", heroHp);
      } else {
        return "LOSE";
      }
    } else {
      const potionHeal = potions.tryHealthPotion(heroHp / heroMaxHpValue);
      if (potionHeal) {
        const healAmount = Math.min(heroMaxHpValue - heroHp, heroMaxHpValue * potionHeal.healPercent * healMult);
        heroHp += healAmount;
        pushStatus(turn, "hero", potionHeal.statusLine, heroHp);
      }
    }

    if (hero.classKey === "PALADIN" && !paladinHealUsed && heroHp / heroMaxHpValue < 0.4) {
      const healAmount = Math.min(heroMaxHpValue - heroHp, heroMaxHpValue * 0.2 * healMult);
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
    const healAmount = Math.min(heroMaxHpValue - heroHp, heroMaxHpValue * 0.15 * healMult);
    if (healAmount <= 0) return;
    heroHp += healAmount;
    events.push({ kind: "heal", turn, actor: "hero", amount: healAmount, targetHpAfter: heroHp });
  }

  const limit = turnLimit(monster.isBoss);

  // Łucznik: 1 darmowy strzał przed walką, poza limitem tur.
  if (hero.classKey === "ARCHER") {
    const outcome = heroAttacks(0, 0, 1);
    if (outcome === "WIN") {
      return finish("WIN", 0);
    }
  }

  const heroInit = initiative(heroDex, randomInt(rng, 1, 10));
  const monsterInit = initiative(monsterDex, randomInt(rng, 1, 10));
  const heroGoesFirst = heroInit >= monsterInit;

  for (const line of abilities.onBattleStart(heroGoesFirst)) {
    pushStatus(1, "hero", line);
  }
  for (const line of potions.onBattleStart()) {
    pushStatus(1, "hero", line);
  }

  let result: BattleResult | null = null;
  let turnsTaken = 0;

  for (let turn = 1; turn <= limit; turn++) {
    turnsTaken = turn;
    const order: CombatSide[] = heroGoesFirst ? ["hero", "monster"] : ["monster", "hero"];

    for (const side of order) {
      if (side === "hero") {
        const hotPercent = abilities.tickHeroHots();
        if (hotPercent > 0 && heroHp < heroMaxHpValue) {
          const healAmount = Math.min(heroMaxHpValue - heroHp, heroMaxHpValue * hotPercent * healMult);
          if (healAmount > 0) {
            heroHp += healAmount;
            events.push({ kind: "heal", turn, actor: "hero", amount: healAmount, targetHpAfter: heroHp });
          }
        }

        const support = abilities.planHeroSupportPhase({ heroHpFrac: heroHp / heroMaxHpValue });
        for (const line of support.statusLines) pushStatus(turn, "hero", line);
        if (support.shieldGainPercent > 0) abilities.gainManaShield(support.shieldGainPercent, heroMaxHpValue);

        const plan = abilities.planHeroAttack(
          {
            monsterHpFrac: monsterHp / monsterMaxHpValue,
            monsterIsBoss: monster.isBoss,
            monsterType: monster.type,
            heroElement,
          },
          rng,
        );

        if (plan.kind === "instantKill") {
          monsterHp = 0;
          pushStatus(turn, "hero", "Egzekucja! Wróg pada od razu.", 0);
          result = "WIN";
        } else if (plan.kind === "override") {
          if (plan.statusBefore) pushStatus(turn, "hero", plan.statusBefore);
          for (let i = 0; i < plan.hits.length; i++) {
            const hit = plan.hits[i];
            const outcome = heroAttacks(turn, i, hit.multiplier, hit);
            if (outcome) {
              result = outcome;
              break;
            }
          }
        } else {
          for (let i = 0; i < classDef.attacksPerTurn; i++) {
            const outcome = heroAttacks(turn, i, 1);
            if (outcome) {
              result = outcome;
              break;
            }
          }
        }

        if (!result) {
          const dotTick = abilities.tickMonsterDots();
          if (dotTick.totalPercent > 0) {
            const dmg = dotTick.totalPercent * monsterMaxHpValue;
            monsterHp = Math.max(0, monsterHp - dmg);
            if (dotTick.statusLine) pushStatus(turn, "hero", dotTick.statusLine, monsterHp);
            if (monsterHp <= 0) result = "WIN";
          }
        }

        if (!result) priestSelfHeal(turn);
        abilities.endOfTurnTick();
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
      heroHpStart: heroHpAtStart,
      heroHpEnd: heroHp,
      monsterHpStart: monsterMaxHpValue,
      monsterHpEnd: monsterHp,
      potionsConsumed: potions.consumedKeys(),
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
