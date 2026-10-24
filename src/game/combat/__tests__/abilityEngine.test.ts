import { describe, expect, it } from "vitest";

import { AbilityRuntime } from "../abilityEngine";
import type { Rng } from "../rng";

const noRoll: Rng = () => 0.99; // nigdy nie trafia procentowych rzutów (np. ogłuszenia)
const alwaysRoll: Rng = () => 0; // zawsze trafia procentowe rzuty

function attackCtx(overrides: Partial<Parameters<AbilityRuntime["planHeroAttack"]>[0]> = {}) {
  return {
    monsterHpFrac: 1,
    monsterIsBoss: false,
    monsterType: "animal" as const,
    heroElement: "physical" as const,
    ...overrides,
  };
}

describe("AbilityRuntime", () => {
  it("zdolność z poziomu 1 jest aktywna nawet bez wyboru gracza", () => {
    const runtime = new AbilityRuntime("WARRIOR", 1, []);
    const plan = runtime.planHeroAttack(attackCtx(), noRoll);
    expect(plan.kind).toBe("override");
    if (plan.kind === "override") expect(plan.hits[0].multiplier).toBe(1.6);
  });

  it("zdolność nieodblokowana na obecnym poziomie bohatera nie aktywuje się, nawet jeśli podana w wyborze", () => {
    const runtime = new AbilityRuntime("WARRIOR", 5, ["rozplatanie"]); // wymaga poz. 25
    const plan = runtime.planHeroAttack(attackCtx(), noRoll);
    // jedyna aktywna to poziom 1 (Potężny zamach)
    expect(plan.kind).toBe("override");
    if (plan.kind === "override") expect(plan.hits[0].multiplier).toBe(1.6);
  });

  it("zdolność wchodzi na odnowienie i wraca po odliczeniu tur", () => {
    const runtime = new AbilityRuntime("WARRIOR", 1, []);
    const first = runtime.planHeroAttack(attackCtx(), noRoll);
    expect(first.kind).toBe("override"); // zużywa Potężny zamach (odnowienie 4 tury)

    const second = runtime.planHeroAttack(attackCtx(), noRoll);
    expect(second.kind).toBe("normal"); // jeszcze na odnowieniu

    for (let i = 0; i < 4; i++) runtime.endOfTurnTick();
    const afterCooldown = runtime.planHeroAttack(attackCtx(), noRoll);
    expect(afterCooldown.kind).toBe("override");
  });

  it("Cios w plecy Łotra odpala się tylko gdy bohater zaczyna walkę", () => {
    const goesFirst = new AbilityRuntime("ROGUE", 1, []);
    goesFirst.onBattleStart(true);
    const plan = goesFirst.planHeroAttack(attackCtx(), noRoll);
    expect(plan.kind).toBe("override");
    if (plan.kind === "override") expect(plan.hits[0].multiplier).toBe(2);

    const goesSecond = new AbilityRuntime("ROGUE", 1, []);
    goesSecond.onBattleStart(false);
    const plan2 = goesSecond.planHeroAttack(attackCtx(), noRoll);
    expect(plan2.kind).toBe("normal");
  });

  it("Egzekucja Łotra zabija od razu zwykłego wroga, a bossa trafia × 3", () => {
    const vsNormal = new AbilityRuntime("ROGUE", 100, ["egzekucja"]);
    const planNormal = vsNormal.planHeroAttack(attackCtx({ monsterHpFrac: 0.1, monsterIsBoss: false }), noRoll);
    expect(planNormal.kind).toBe("instantKill");

    const vsBoss = new AbilityRuntime("ROGUE", 100, ["egzekucja"]);
    const planBoss = vsBoss.planHeroAttack(attackCtx({ monsterHpFrac: 0.1, monsterIsBoss: true }), noRoll);
    expect(planBoss.kind).toBe("override");
    if (planBoss.kind === "override") expect(planBoss.hits[0].multiplier).toBe(3);
  });

  it("Egzekucja nie odpala się, gdy wróg ma ponad 15% PŻ", () => {
    const runtime = new AbilityRuntime("ROGUE", 100, ["egzekucja"]);
    const plan = runtime.planHeroAttack(attackCtx({ monsterHpFrac: 0.5 }), noRoll);
    expect(plan.kind).not.toBe("instantKill");
  });

  it("Krwawa rana Wojownika nakłada krwawienie na 4 tury, potem gaśnie", () => {
    const runtime = new AbilityRuntime("WARRIOR", 45, ["krwawa-rana"]);
    // poziom 1 "Potężny zamach" jest wyżej w priorytecie i może zasłonić krwawą ranę
    // tylko jeśli gotowa; na pierwszej turze obie są gotowe, ale krwawa-rana ma
    // wyższy priorytet w switchu Wojownika, więc odpali się pierwsza.
    const plan = runtime.planHeroAttack(attackCtx(), noRoll);
    expect(plan.kind).toBe("override");

    let ticks = 0;
    let total = 0;
    for (let i = 0; i < 6; i++) {
      const tick = runtime.tickMonsterDots();
      if (tick.totalPercent > 0) {
        ticks += 1;
        total += tick.totalPercent;
      }
    }
    expect(ticks).toBe(4);
    expect(total).toBeCloseTo(0.16, 5);
  });

  it("Uderzenie tarczą Paladyna może ogłuszyć wroga na jego turę", () => {
    const runtime = new AbilityRuntime("PALADIN", 1, []);
    runtime.planHeroAttack(attackCtx(), alwaysRoll); // alwaysRoll trafia szansę 30% ogłuszenia
    const skip = runtime.monsterSkipsTurn();
    expect(skip).not.toBeNull();
  });

  it("Wskrzeszenie Kapłana działa tylko raz na walkę", () => {
    const runtime = new AbilityRuntime("PRIEST", 100, ["wskrzeszenie"]);
    expect(runtime.tryResurrect()).toBe(true);
    expect(runtime.tryResurrect()).toBe(false);
  });

  it("Jad na ostrzach Łotra nakłada maks. 3 stosy trucizny", () => {
    const runtime = new AbilityRuntime("ROGUE", 10, ["jad-na-ostrzach"]);
    for (let i = 0; i < 5; i++) runtime.onHeroHitLands();
    const tick = runtime.tickMonsterDots();
    expect(tick.totalPercent).toBeCloseTo(0.06, 5); // 3 stosy × 2%
  });
});
