import { abilitiesForClass } from "@/game/data/abilities";
import type { Rng } from "./rng";
import type { ClassKey, Element, MonsterType } from "./types";

/**
 * Silnik zdolności klas (docs/gdd/02-systemy-walki.md, "Zdolności klas").
 * Osobny moduł od simulate.ts, żeby ten nie rozrósł się do nieczytelności –
 * simulate.ts woła go w ustalonych punktach tury i stosuje wynik.
 *
 * Każda tura bohatera ma dwie fazy:
 *  1) bufy/leczenie/obrona – mogą zadziałać WSZYSTKIE gotowe (nie zajmują "ataku")
 *  2) atak – zadziała NAJWYŻEJ JEDNA gotowa zdolność ofensywna (zamiast zwykłego
 *     ataku); jeśli żadna nie jest gotowa, bohater atakuje normalnie.
 *
 * Zdolność z poziomu 1 jest zawsze aktywna; gracz dodatkowo wybiera do 3
 * z odblokowanych (src/game/character/abilitySelection.ts).
 *
 * Uwaga o uproszczeniach (żadne z nich nie zmienia liczb balansu z GDD):
 *  - Kapłana "Oczyszczenie" i mikstury czyszczące nigdy nie mają efektu w tej
 *    wersji, bo żaden potwór/boss jeszcze nie zatruwa/przeklina bohatera –
 *    warunek "gdy trzeba" po prostu nigdy nie jest prawdziwy. To jest zgodne
 *    z regułą, nie błąd.
 *  - Teksty zdolności w raporcie to jedna stała linia na efekt, nie pula
 *    wariantów jak zwykłe ciosy (docs/gdd/03-teksty-raportow.md) – do
 *    rozważenia w kolejnej iteracji.
 */

export interface AttackHit {
  multiplier: number;
  element?: Element;
  ignoreDefense?: boolean;
  defensePierce?: number;
  ignoreResist?: boolean;
  forceHit?: boolean;
  forceCrit?: boolean;
}

export type HeroTurnPlan =
  | { kind: "normal" }
  | { kind: "instantKill" }
  | { kind: "override"; hits: AttackHit[]; statusBefore?: string };

export class AbilityRuntime {
  private readonly classKey: ClassKey;
  private readonly active: Set<string>;
  private readonly cooldowns = new Map<string, number>();
  private readonly usedOnce = new Set<string>();

  // bufy/efekty czasowe
  private atkBuffTurns = 0;
  private atkBuffMult = 0;
  private atkBuffElement: Element | null = null;
  private dmgTakenReductionTurns = 0;
  private dmgTakenReductionPct = 0;
  private blockBonusTurns = 0;
  private blockBonusPct = 0;
  private dodgeBonusTurns = 0;
  private dodgeBonusPct = 0;
  private archerOdskokArmed = false;
  private rogueJustDodged = false;
  private monsterStunnedTurns = 0;
  private monsterSlowRemaining = 0;
  private monsterSlowToggle = false;
  private manaShieldHp = 0;
  private divineShieldCharges = 0;
  private overloadRestTurns = 0;
  private monsterDots: Array<{ percentMaxHp: number; remainingTurns: number | null }> = [];
  private heroHots: Array<{ percentMaxHp: number; remainingTurns: number }> = [];
  private nieustepliwoscUsed = false;

  constructor(classKey: ClassKey, level: number, selectedAbilities: string[]) {
    this.classKey = classKey;
    const ownAbilities = abilitiesForClass(classKey);
    const level1 = ownAbilities.find((a) => a.level === 1);
    const selected = new Set(selectedAbilities.filter((k) => ownAbilities.some((a) => a.key === k && a.level <= level)));
    if (level1) selected.add(level1.key);
    this.active = selected;
  }

  private has(key: string): boolean {
    return this.active.has(key);
  }

  private ready(key: string): boolean {
    return (this.cooldowns.get(key) ?? 0) <= 0 && !this.usedOnce.has(key);
  }

  private start(key: string, cooldownTurns: number | null, once: boolean): void {
    if (once) this.usedOnce.add(key);
    if (cooldownTurns != null) this.cooldowns.set(key, cooldownTurns);
  }

  /** Woła simulate.ts po obliczeniu kto zaczyna. */
  onBattleStart(heroGoesFirst: boolean): string[] {
    const status: string[] = [];

    if (this.has("okrzyk-bojowy") && this.ready("okrzyk-bojowy")) {
      this.atkBuffTurns = 3;
      this.atkBuffMult = 0.15;
      this.start("okrzyk-bojowy", null, true);
      status.push("Wydajesz okrzyk bojowy: +15% ataku na 3 tury!");
    }

    if (this.has("cios-w-plecy") && heroGoesFirst && this.ready("cios-w-plecy")) {
      this.start("cios-w-plecy", null, true);
      this.pendingBackstab = true;
    }

    return status;
  }

  private pendingBackstab = false;

  /** Fazy 1: bufy/leczenie/obrona – zwraca efekty do zastosowania przez simulate.ts. */
  planHeroSupportPhase(ctx: { heroHpFrac: number }): { shieldGainPercent: number; statusLines: string[] } {
    const statusLines: string[] = [];
    let shieldGainPercent = 0;

    if (this.has("swieta-bron") && this.ready("swieta-bron")) {
      this.atkBuffTurns = Math.max(this.atkBuffTurns, 4);
      this.atkBuffMult += 0.2;
      this.atkBuffElement = "light";
      this.start("swieta-bron", 6, false);
      statusLines.push("Broń bohatera płonie świętym światłem (+20% obrażeń przez 4 tury).");
    }

    if (this.has("ochrona-wiary") && this.ready("ochrona-wiary")) {
      this.blockBonusTurns = 3;
      this.blockBonusPct = 0.3;
      this.start("ochrona-wiary", 6, false);
      statusLines.push("Tarcza Paladyna błyszczy mocniej: +30% bloku na 3 tury.");
    }

    if (this.has("boska-tarcza") && this.ready("boska-tarcza")) {
      this.divineShieldCharges = 2;
      this.start("boska-tarcza", null, true);
      statusLines.push("Boska tarcza osłania bohatera przed następnymi 2 ciosami.");
    }

    if (this.has("zaslona-dymna") && this.ready("zaslona-dymna")) {
      this.dodgeBonusTurns = 2;
      this.dodgeBonusPct = 0.3;
      this.start("zaslona-dymna", 5, false);
      statusLines.push("Łotr zasnuwa pole walki dymem: +30% uniku na 2 tury.");
    }

    if (this.has("magiczna-tarcza") && this.ready("magiczna-tarcza")) {
      shieldGainPercent = 0.2;
      this.start("magiczna-tarcza", 6, false);
      statusLines.push("Magiczna tarcza pochłania nadchodzące obrażenia.");
    }

    if (this.has("przeciazenie-many") && this.overloadRestTurns === 0 && this.ready("przeciazenie-many")) {
      this.atkBuffTurns = Math.max(this.atkBuffTurns, 3);
      this.atkBuffMult += 0.3;
      this.start("przeciazenie-many", 8, false);
      this.overloadRestTurns = 4; // 3 tury buffa + 1 tura przerwy
      statusLines.push("Mag przeciąża manę: +30% obrażeń zaklęć na 3 tury.");
    }

    if (this.has("odnowa") && this.ready("odnowa")) {
      this.heroHots.push({ percentMaxHp: 0.06, remainingTurns: 3 });
      this.start("odnowa", 6, false);
      statusLines.push("Modlitwa Odnowy leczy bohatera przez 3 tury.");
    }

    if (this.has("modlitwa-ochronna") && this.ready("modlitwa-ochronna")) {
      this.dmgTakenReductionTurns = 3;
      this.dmgTakenReductionPct = 0.25;
      this.start("modlitwa-ochronna", 7, false);
      statusLines.push("Modlitwa ochronna zmniejsza otrzymywane obrażenia o 25% na 3 tury.");
    }

    if (this.has("nieustepliwosc") && !this.nieustepliwoscUsed && ctx.heroHpFrac < 0.25) {
      this.dmgTakenReductionTurns = Math.max(this.dmgTakenReductionTurns, 3);
      this.dmgTakenReductionPct = Math.max(this.dmgTakenReductionPct, 0.3);
      this.nieustepliwoscUsed = true;
      statusLines.push("Nieustępliwość bohatera zmniejsza obrażenia o 30% na 3 tury.");
    }

    // Oczyszczenie: nigdy nic nie czyści, bo bohater w tej wersji nie bywa
    // zatruty/przeklęty/krwawiący – warunek "gdy trzeba" nigdy nie jest prawdziwy.

    return { shieldGainPercent, statusLines };
  }

  /** Leczenie-w-czasie bohatera (np. Odnowa); wywołane raz na turę bohatera. */
  tickHeroHots(): number {
    if (this.heroHots.length === 0) return 0;
    let total = 0;
    const next: typeof this.heroHots = [];
    for (const hot of this.heroHots) {
      total += hot.percentMaxHp;
      if (hot.remainingTurns > 1) next.push({ ...hot, remainingTurns: hot.remainingTurns - 1 });
    }
    this.heroHots = next;
    return total;
  }

  /** Faza 2: wybiera akcję ataku bohatera na tę turę. `rng` – to samo ziarno walki, dla powtarzalności. */
  planHeroAttack(
    ctx: {
      monsterHpFrac: number;
      monsterIsBoss: boolean;
      monsterType: MonsterType;
      heroElement: Element;
    },
    rng: Rng,
  ): HeroTurnPlan {
    if (this.pendingBackstab) {
      this.pendingBackstab = false;
      return { kind: "override", hits: [{ multiplier: 2 }], statusBefore: "Cios w plecy zaskakuje wroga!" };
    }

    if (this.has("egzekucja") && this.ready("egzekucja") && ctx.monsterHpFrac < 0.15) {
      this.start("egzekucja", null, true);
      if (ctx.monsterIsBoss) {
        return { kind: "override", hits: [{ multiplier: 3 }], statusBefore: "Łotr szykuje egzekucję!" };
      }
      return { kind: "instantKill" };
    }

    switch (this.classKey) {
      case "WARRIOR":
        if (this.has("furia-tytana") && this.ready("furia-tytana")) {
          this.start("furia-tytana", 7, false);
          return { kind: "override", hits: [0.8, 0.8, 0.8].map((m) => ({ multiplier: m })), statusBefore: "Furia Tytana!" };
        }
        if (this.has("krwawa-rana") && this.ready("krwawa-rana")) {
          this.start("krwawa-rana", 6, false);
          this.monsterDots.push({ percentMaxHp: 0.04, remainingTurns: 4 });
          return { kind: "override", hits: [{ multiplier: 1 }], statusBefore: "Krwawa rana zaczyna krwawić wroga." };
        }
        if (this.has("rozplatanie") && this.ready("rozplatanie")) {
          this.start("rozplatanie", 5, false);
          return { kind: "override", hits: [{ multiplier: 1, defensePierce: 0.5 }], statusBefore: "Rozpłatanie przebija obronę wroga." };
        }
        if (this.has("potezny-zamach") && this.ready("potezny-zamach")) {
          this.start("potezny-zamach", 4, false);
          return { kind: "override", hits: [{ multiplier: 1.6 }] };
        }
        break;

      case "PALADIN":
        if (this.has("wyrok") && this.ready("wyrok") && ctx.monsterHpFrac < 0.3) {
          this.start("wyrok", 5, false);
          return { kind: "override", hits: [{ multiplier: 2 }], statusBefore: "Wyrok spada na słabnącego wroga." };
        }
        if (this.has("uderzenie-tarcza") && this.ready("uderzenie-tarcza")) {
          this.start("uderzenie-tarcza", 4, false);
          if (rng() < 0.3) this.monsterStunnedTurns += 1;
          return { kind: "override", hits: [{ multiplier: 1.2 }], statusBefore: "Uderzenie tarczą!" };
        }
        break;

      case "ARCHER":
        if (this.has("strzala-pradrzewa") && this.ready("strzala-pradrzewa")) {
          this.start("strzala-pradrzewa", null, true);
          return { kind: "override", hits: [{ multiplier: 3, ignoreDefense: true }], statusBefore: "Strzała Pradrzewa!" };
        }
        if (this.has("strzal-w-slaby-punkt") && this.ready("strzal-w-slaby-punkt")) {
          this.start("strzal-w-slaby-punkt", 6, false);
          return { kind: "override", hits: [{ multiplier: 1, forceCrit: true }], statusBefore: "Strzał w słaby punkt!" };
        }
        if (this.has("grad-strzal") && this.ready("grad-strzal")) {
          this.start("grad-strzal", 5, false);
          return { kind: "override", hits: [0.5, 0.5, 0.5].map((m) => ({ multiplier: m })), statusBefore: "Grad strzał!" };
        }
        if (this.has("zatruta-strzala") && this.ready("zatruta-strzala")) {
          this.start("zatruta-strzala", 5, false);
          this.monsterDots.push({ percentMaxHp: 0.03, remainingTurns: 4 });
          return { kind: "override", hits: [{ multiplier: 1 }], statusBefore: "Zatruta strzała wnika w ranę wroga." };
        }
        if (this.has("celny-strzal") && this.ready("celny-strzal")) {
          this.start("celny-strzal", 4, false);
          return { kind: "override", hits: [{ multiplier: 1.5, forceHit: true }] };
        }
        break;

      case "ROGUE":
        if (this.has("taniec-ostrzy") && this.ready("taniec-ostrzy")) {
          this.start("taniec-ostrzy", 5, false);
          return { kind: "override", hits: [0.5, 0.5, 0.5, 0.5].map((m) => ({ multiplier: m })), statusBefore: "Taniec ostrzy!" };
        }
        if (this.rogueJustDodged && this.has("cienisty-krok")) {
          this.rogueJustDodged = false;
          return { kind: "override", hits: [{ multiplier: 1.5, element: "shadow" }], statusBefore: "Cienisty krok uderza z cienia." };
        }
        break;

      case "MAGE":
        if (this.has("gniazdo-meteorow") && this.ready("gniazdo-meteorow")) {
          this.start("gniazdo-meteorow", null, true);
          return { kind: "override", hits: [{ multiplier: 3, ignoreResist: true }], statusBefore: "Gniazdo meteorów!" };
        }
        if (this.has("zaklecie-zywiolu") && this.ready("zaklecie-zywiolu")) {
          this.start("zaklecie-zywiolu", 5, false);
          if (ctx.heroElement === "ice") this.monsterSlowRemaining = Math.max(this.monsterSlowRemaining, 1);
          return { kind: "override", hits: [{ multiplier: 2 }], statusBefore: "Potężne zaklęcie żywiołu!" };
        }
        if (this.has("spowolnienie") && this.ready("spowolnienie")) {
          this.start("spowolnienie", 7, false);
          this.monsterSlowRemaining = 4;
          this.monsterSlowToggle = false;
          return { kind: "override", hits: [{ multiplier: 1 }], statusBefore: "Wróg zostaje spowolniony." };
        }
        if (this.has("pocisk-mocy") && this.ready("pocisk-mocy")) {
          this.start("pocisk-mocy", 4, false);
          return { kind: "override", hits: [{ multiplier: 1.5 }] };
        }
        break;

      case "PRIEST":
        if (
          this.has("kara-niebios") &&
          this.ready("kara-niebios") &&
          (ctx.monsterType === "undead" || ctx.monsterType === "demon")
        ) {
          this.start("kara-niebios", 5, false);
          return { kind: "override", hits: [{ multiplier: 2.5, element: "light" }], statusBefore: "Kara niebios spada na wroga!" };
        }
        if (this.has("swiety-plomien") && this.ready("swiety-plomien")) {
          this.start("swiety-plomien", 4, false);
          return { kind: "override", hits: [{ multiplier: 1.4, element: "light" }] };
        }
        break;
    }

    return { kind: "normal" };
  }

  attackPowerMultiplier(): { mult: number; element: Element | null } {
    return { mult: 1 + this.atkBuffMult, element: this.atkBuffElement };
  }

  /** Czy wróg jest ogłuszony/spowolniony i traci tę turę; zwraca też linię statusu. */
  monsterSkipsTurn(): string | null {
    if (this.monsterStunnedTurns > 0) {
      this.monsterStunnedTurns -= 1;
      return "Wróg jest ogłuszony i traci turę.";
    }
    if (this.monsterSlowRemaining > 0) {
      this.monsterSlowRemaining -= 1;
      this.monsterSlowToggle = !this.monsterSlowToggle;
      if (this.monsterSlowToggle) return "Wróg jest spowolniony i traci turę.";
    }
    return null;
  }

  /** Modyfikatory obrażeń PRZYCHODZĄCYCH do bohatera (przed ewentualnym unikiem/blokiem). */
  incomingDamageModifiers(monsterType: MonsterType): { reductionPct: number } {
    let reduction = this.dmgTakenReductionPct;
    if (this.has("aura-odwagi") && (monsterType === "undead" || monsterType === "demon")) {
      reduction = 1 - (1 - reduction) * (1 - 0.15);
    }
    return { reductionPct: Math.min(0.9, reduction) };
  }

  /** Dodatkowy unik (poza zwykłym trafieniem) – zwraca true jeśli cios ma być uniknięty. `rng` – ziarno walki. */
  rollExtraDodge(rng: Rng): boolean {
    let chance = this.dodgeBonusTurns > 0 ? this.dodgeBonusPct : 0;
    if (this.archerOdskokArmed) {
      chance += 0.25;
    }
    const dodged = chance > 0 && rng() < chance;
    if (this.archerOdskokArmed) this.archerOdskokArmed = false;
    if (dodged && this.has("cienisty-krok")) this.rogueJustDodged = true;
    return dodged;
  }

  /** Pochłania obrażenia tarczą many/boską tarczą; zwraca realne obrażenia po pochłonięciu. */
  absorbDamage(damage: number): { damage: number; statusLine: string | null } {
    if (this.divineShieldCharges > 0) {
      this.divineShieldCharges -= 1;
      return { damage: 0, statusLine: "Boska tarcza pochłania cios całkowicie." };
    }
    if (this.manaShieldHp > 0) {
      const absorbed = Math.min(this.manaShieldHp, damage);
      this.manaShieldHp -= absorbed;
      return { damage: damage - absorbed, statusLine: absorbed > 0 ? "Magiczna tarcza pochłania część obrażeń." : null };
    }
    return { damage, statusLine: null };
  }

  gainManaShield(percent: number, heroMaxHp: number): void {
    this.manaShieldHp += percent * heroMaxHp;
  }

  /** Woła simulate.ts po tym, jak wróg trafi bohatera (przed uwzględnieniem odskoku). */
  onHeroHitByMonster(): void {
    this.archerOdskokArmed = this.has("odskok");
  }

  /** Jad na ostrzach – pasywnie dodaje stos trucizny na wroga po KAŻDYM trafionym ciosie Łotra. */
  onHeroHitLands(): void {
    if (this.has("jad-na-ostrzach")) {
      const activeStacks = this.monsterDots.filter((d) => d.remainingTurns === null).length;
      if (activeStacks < 3) {
        this.monsterDots.push({ percentMaxHp: 0.02, remainingTurns: null });
      }
    }
  }

  /** Tyka DOT-y na wrogu; wywołane raz na turę. Zwraca sumę % PŻ (z maks. PŻ wroga) i linię statusu. */
  tickMonsterDots(): { totalPercent: number; statusLine: string | null } {
    if (this.monsterDots.length === 0) return { totalPercent: 0, statusLine: null };

    let total = 0;
    const next: typeof this.monsterDots = [];
    for (const dot of this.monsterDots) {
      total += dot.percentMaxHp;
      if (dot.remainingTurns === null) {
        next.push(dot);
      } else if (dot.remainingTurns > 1) {
        next.push({ ...dot, remainingTurns: dot.remainingTurns - 1 });
      }
    }
    this.monsterDots = next;

    return { totalPercent: total, statusLine: total > 0 ? "Rany zadane wcześniej krwawią/zatruwają wroga." : null };
  }

  /** Wskrzeszenie – przechwytuje śmierć bohatera raz na walkę. */
  tryResurrect(): boolean {
    if (!this.has("wskrzeszenie") || !this.ready("wskrzeszenie")) return false;
    this.start("wskrzeszenie", null, true);
    return true;
  }

  /** Dekrementuje liczniki bufów/odnowień na koniec tury bohatera. */
  endOfTurnTick(): void {
    if (this.atkBuffTurns > 0) {
      this.atkBuffTurns -= 1;
      if (this.atkBuffTurns === 0) {
        this.atkBuffMult = 0;
        this.atkBuffElement = null;
      }
    }
    if (this.dmgTakenReductionTurns > 0) {
      this.dmgTakenReductionTurns -= 1;
      if (this.dmgTakenReductionTurns === 0) this.dmgTakenReductionPct = 0;
    }
    if (this.blockBonusTurns > 0) {
      this.blockBonusTurns -= 1;
      if (this.blockBonusTurns === 0) this.blockBonusPct = 0;
    }
    if (this.dodgeBonusTurns > 0) {
      this.dodgeBonusTurns -= 1;
      if (this.dodgeBonusTurns === 0) this.dodgeBonusPct = 0;
    }
    if (this.overloadRestTurns > 0) this.overloadRestTurns -= 1;

    for (const [key, remaining] of this.cooldowns) {
      if (remaining > 0) this.cooldowns.set(key, remaining - 1);
    }
  }

  extraBlockChance(): number {
    return this.blockBonusTurns > 0 ? this.blockBonusPct : 0;
  }
}
