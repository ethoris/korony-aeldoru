/**
 * Mikstury bojowe w walce (docs/gdd/11-gospodarka-i-zadania.md). Osobny,
 * mały moduł od abilityEngine.ts – mikstury nie mają odnowień, tylko proste
 * warunki. "Antidotum"/"Woda święcona" nigdy nie mają efektu w tej wersji
 * (jak Oczyszczenie Kapłana): nic jeszcze nie zatruwa/przeklina bohatera.
 */
export class PotionRuntime {
  private readonly selected: Set<string>;
  private readonly isBoss: boolean;
  private readonly consumed = new Set<string>();
  private healthPotionUsedThisBattle = false;
  private atkBonusPercent = 0;
  private defBonusPercent = 0;

  constructor(selectedPotions: string[], isBoss: boolean) {
    this.selected = new Set(selectedPotions);
    this.isBoss = isBoss;
    // Eliksiry działają od razu w turze 1, na całą walkę – bonus jest
    // znany od razu, żeby simulate.ts mógł go wliczyć do Ataku/Obrony
    // zanim zacznie się pierwsza tura.
    if (this.selected.has("eliksir-sily")) this.atkBonusPercent = 15;
    if (this.selected.has("eliksir-kamiennej-skory")) this.defBonusPercent = 20;
  }

  /** Tekst do raportu + oznaczenie zużycia (do odliczenia z zapasów przy rozliczeniu). */
  onBattleStart(): string[] {
    const status: string[] = [];
    if (this.selected.has("eliksir-sily")) {
      this.consumed.add("eliksir-sily");
      status.push("Eliksir siły wzmacnia ciosy bohatera na całą walkę.");
    }
    if (this.selected.has("eliksir-kamiennej-skory")) {
      this.consumed.add("eliksir-kamiennej-skory");
      status.push("Eliksir kamiennej skóry wzmacnia obronę bohatera na całą walkę.");
    }
    return status;
  }

  atkBonus(): number {
    return this.atkBonusPercent;
  }

  defBonus(): number {
    return this.defBonusPercent;
  }

  /** Woła simulate.ts po każdym obniżeniu PŻ bohatera. Zwraca % PŻ do uleczenia (0 = brak). */
  tryHealthPotion(heroHpFrac: number): { healPercent: number; statusLine: string } | null {
    if (heroHpFrac >= 0.35) return null;
    if (this.isBoss && this.healthPotionUsedThisBattle) return null; // maks. 1 mikstura życia vs boss

    if (this.selected.has("duza-mikstura-zycia") && !this.consumed.has("duza-mikstura-zycia") && (!this.isBoss || !this.healthPotionUsedThisBattle)) {
      this.consumed.add("duza-mikstura-zycia");
      this.healthPotionUsedThisBattle = true;
      return { healPercent: 0.5, statusLine: "Bohater wypija dużą miksturę życia." };
    }
    if (this.selected.has("mala-mikstura-zycia") && !this.consumed.has("mala-mikstura-zycia")) {
      this.consumed.add("mala-mikstura-zycia");
      this.healthPotionUsedThisBattle = true;
      return { healPercent: 0.25, statusLine: "Bohater wypija małą miksturę życia." };
    }
    return null;
  }

  consumedKeys(): string[] {
    return Array.from(this.consumed);
  }
}
