import { CLASSES } from "@/game/data/classes";

import { attackPower, heroDefense, heroMaxHp, initiative, turnLimit } from "./formulas";
import { createRng, randomInt, rollChance } from "./rng";
import { resolveAttack } from "./simulate";
import type { AttackEvent, BattleEvent, BattleOutcome, BattleResult, CombatSide, HeroConfig } from "./types";

/**
 * Pojedynek PvP (docs/gdd/00-glowny.md, docs/gdd/02-systemy-walki.md): dwóch
 * bohaterów, symetrycznie te same wzory co wyprawa. Uproszczenie wersji 4 –
 * zdolności klas, mikstury i żywioł broni/zaklęć NIE są wliczone (GDD opisuje
 * je tylko w kontekście wypraw PvE, nie pojedynków) – obrażenia są zawsze
 * fizyczne, oba mnożniki tylko ze statystyk, ekwipunku (% cechy) i taktyki.
 * "hero" = atakujący, "monster" = obrońca (te same etykiety co silnik PvE).
 */
export function simulatePvpDuel(attacker: HeroConfig, defender: HeroConfig, seed: number): BattleOutcome {
  const rng = createRng(seed);

  function sideStats(hero: HeroConfig) {
    const classDef = CLASSES[hero.classKey];
    const tactic = hero.tactic ?? "BALANCED";
    const atkTacticMult = tactic === "AGGRESSIVE" ? 1.15 : tactic === "DEFENSIVE" ? 0.85 : 1;
    const defTacticMult = tactic === "AGGRESSIVE" ? 0.85 : tactic === "DEFENSIVE" ? 1.15 : 1;
    const mainStatValue = hero.stats[classDef.mainStat];
    return {
      attackPower:
        attackPower(hero.weaponDamage, mainStatValue) * atkTacticMult * (1 + (hero.gearDamagePercent ?? 0) / 100),
      defenseValue:
        heroDefense(hero.armorFromGear, hero.stats.vitality) * defTacticMult * (1 + (hero.gearArmorPercent ?? 0) / 100),
      maxHp: heroMaxHp(hero.stats.vitality, hero.level) + (hero.bonusMaxHp ?? 0),
      dex: hero.stats.dexterity,
      blockChance: (hero.hasShield ? 0.15 : 0) + (hero.gearBlockPercent ?? 0) / 100,
      gearHitPercent: hero.gearHitPercent ?? 0,
      gearCritPercent: hero.gearCritPercent ?? 0,
    };
  }

  const atk = sideStats(attacker);
  const def = sideStats(defender);

  let attackerHp = atk.maxHp;
  let defenderHp = def.maxHp;
  const events: BattleEvent[] = [];

  function attack(turn: number, side: CombatSide): BattleResult | null {
    const isAttacker = side === "hero";
    const offense = isAttacker ? atk : def;
    const defense = isAttacker ? def : atk;

    const resolution = resolveAttack(rng, {
      attackerLevel: isAttacker ? attacker.level : defender.level,
      attackerDex: offense.dex,
      defenderLevel: isAttacker ? defender.level : attacker.level,
      defenderDex: defense.dex,
      attackPowerValue: offense.attackPower,
      defenseValue: defense.defenseValue,
      ignoreDefense: false,
      element: "physical",
      weakTo: [],
      resistTo: [],
      gearHitBonus: offense.gearHitPercent,
      gearCritBonus: offense.gearCritPercent,
    });

    const blocked = resolution.hit && defense.blockChance > 0 && rollChance(rng, defense.blockChance);
    const damage = blocked ? 0 : resolution.hit ? resolution.damage : 0;

    if (isAttacker) defenderHp = Math.max(0, defenderHp - damage);
    else attackerHp = Math.max(0, attackerHp - damage);

    const event: AttackEvent = {
      kind: "attack",
      turn,
      actor: side,
      attackIndex: 0,
      hit: resolution.hit,
      crit: resolution.crit,
      blocked,
      damage,
      element: resolution.element,
      weakHit: false,
      resistHit: false,
      targetHpAfter: isAttacker ? defenderHp : attackerHp,
    };
    events.push(event);

    if (isAttacker && defenderHp <= 0) return "WIN";
    if (!isAttacker && attackerHp <= 0) return "LOSE";
    return null;
  }

  const attackerInit = initiative(atk.dex, randomInt(rng, 1, 10));
  const defenderInit = initiative(def.dex, randomInt(rng, 1, 10));
  const attackerGoesFirst = attackerInit >= defenderInit;

  const limit = turnLimit(false);
  let result: BattleResult = "DRAW";
  let turnsTaken = 0;

  for (let turn = 1; turn <= limit; turn++) {
    turnsTaken = turn;
    const order: CombatSide[] = attackerGoesFirst ? ["hero", "monster"] : ["monster", "hero"];
    let finished: BattleResult | null = null;
    for (const side of order) {
      finished = attack(turn, side);
      if (finished) break;
    }
    if (finished) {
      result = finished;
      break;
    }
  }

  return {
    result,
    turnsTaken,
    events,
    heroHpStart: atk.maxHp,
    heroHpEnd: attackerHp,
    monsterHpStart: def.maxHp,
    monsterHpEnd: defenderHp,
    potionsConsumed: [],
  };
}
