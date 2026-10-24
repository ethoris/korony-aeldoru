import { describe, expect, it } from "vitest";

import { PotionRuntime } from "../potionEngine";

describe("PotionRuntime", () => {
  it("eliksiry dają bonus do ataku/obrony od razu, bez odnowienia", () => {
    const runtime = new PotionRuntime(["eliksir-sily", "eliksir-kamiennej-skory"], false);
    expect(runtime.atkBonus()).toBe(15);
    expect(runtime.defBonus()).toBe(20);
  });

  it("mikstura życia leczy tylko poniżej 35% PŻ i tylko raz", () => {
    const runtime = new PotionRuntime(["mala-mikstura-zycia"], false);
    expect(runtime.tryHealthPotion(0.5)).toBeNull();
    const first = runtime.tryHealthPotion(0.2);
    expect(first?.healPercent).toBe(0.25);
    expect(runtime.tryHealthPotion(0.1)).toBeNull(); // już zużyta
  });

  it("w walce z bossem działa maks. 1 mikstura życia, nawet przy dwóch w pasie", () => {
    const runtime = new PotionRuntime(["mala-mikstura-zycia", "duza-mikstura-zycia"], true);
    const first = runtime.tryHealthPotion(0.2);
    expect(first).not.toBeNull();
    const second = runtime.tryHealthPotion(0.1);
    expect(second).toBeNull();
  });

  it("poza bossem mikstury życia liczą się jako osobne zużycia", () => {
    const runtime = new PotionRuntime(["mala-mikstura-zycia", "duza-mikstura-zycia"], false);
    const first = runtime.tryHealthPotion(0.2);
    expect(first?.healPercent).toBe(0.5); // duża ma priorytet
    const second = runtime.tryHealthPotion(0.1);
    expect(second?.healPercent).toBe(0.25);
  });

  it("consumedKeys zwraca tylko faktycznie użyte mikstury", () => {
    const runtime = new PotionRuntime(["eliksir-sily", "mala-mikstura-zycia"], false);
    runtime.onBattleStart();
    expect(runtime.consumedKeys()).toEqual(["eliksir-sily"]);
    runtime.tryHealthPotion(0.1);
    expect(runtime.consumedKeys().sort()).toEqual(["eliksir-sily", "mala-mikstura-zycia"]);
  });

  it("antidotum i woda święcona nigdy nie trafiają do consumedKeys (nic jeszcze nie zatruwa/przeklina bohatera)", () => {
    const runtime = new PotionRuntime(["antidotum", "woda-swiecona"], false);
    runtime.onBattleStart();
    runtime.tryHealthPotion(0.1);
    expect(runtime.consumedKeys()).toEqual([]);
  });
});
