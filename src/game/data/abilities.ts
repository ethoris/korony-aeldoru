import type { ClassKey } from "@/game/combat/types";

/**
 * Zdolności klas z docs/gdd/02-systemy-walki.md ("Zdolności klas"). Każda
 * klasa ma 6 zdolności odblokowywanych na poziomach 1/10/25/45/70/100.
 * Zdolność z poziomu 1 jest zawsze aktywna i nie zajmuje miejsca w wyborze;
 * gracz wybiera do 3 z pozostałych 5, odblokowanych na jego poziomie,
 * przed każdą wyprawą (docs/gdd/13-technika.md, ekran Wyprawy).
 *
 * Ten plik jest tylko opisem (do UI i walidacji wyboru) – logika efektów
 * jest w src/game/combat/abilityEngine.ts.
 */
export interface AbilityDefinition {
  key: string;
  classKey: ClassKey;
  level: number;
  name: string;
  effectText: string;
  /** Tury odnowienia; null = zdolność pasywna albo "raz na walkę" (patrz oncePerBattle). */
  cooldownTurns: number | null;
  oncePerBattle: boolean;
}

export const ABILITIES: Record<ClassKey, AbilityDefinition[]> = {
  WARRIOR: [
    { key: "potezny-zamach", classKey: "WARRIOR", level: 1, name: "Potężny zamach", effectText: "cios × 1,6", cooldownTurns: 4, oncePerBattle: false },
    { key: "okrzyk-bojowy", classKey: "WARRIOR", level: 10, name: "Okrzyk bojowy", effectText: "+15% ataku na 3 tury", cooldownTurns: null, oncePerBattle: true },
    { key: "rozplatanie", classKey: "WARRIOR", level: 25, name: "Rozpłatanie", effectText: "cios ignoruje 50% obrony; jeśli zabije, darmowy kolejny atak", cooldownTurns: 5, oncePerBattle: false },
    { key: "krwawa-rana", classKey: "WARRIOR", level: 45, name: "Krwawa rana", effectText: "krwawienie: 4% PŻ wroga na turę przez 4 tury", cooldownTurns: 6, oncePerBattle: false },
    { key: "nieustepliwosc", classKey: "WARRIOR", level: 70, name: "Nieustępliwość", effectText: "poniżej 25% PŻ: −30% otrzymywanych obrażeń przez 3 tury", cooldownTurns: null, oncePerBattle: true },
    { key: "furia-tytana", classKey: "WARRIOR", level: 100, name: "Furia Tytana", effectText: "3 ciosy po 80% obrażeń", cooldownTurns: 7, oncePerBattle: false },
  ],
  PALADIN: [
    { key: "uderzenie-tarcza", classKey: "PALADIN", level: 1, name: "Uderzenie tarczą", effectText: "cios × 1,2, 30% szansy na ogłuszenie", cooldownTurns: 4, oncePerBattle: false },
    { key: "swieta-bron", classKey: "PALADIN", level: 10, name: "Święta broń", effectText: "ciosy zadają +20% obrażeń jako Światło przez 4 tury", cooldownTurns: 6, oncePerBattle: false },
    { key: "ochrona-wiary", classKey: "PALADIN", level: 25, name: "Ochrona wiary", effectText: "blok tarczy +30% przez 3 tury", cooldownTurns: 6, oncePerBattle: false },
    { key: "wyrok", classKey: "PALADIN", level: 45, name: "Wyrok", effectText: "wróg poniżej 30% PŻ: cios × 2", cooldownTurns: 5, oncePerBattle: false },
    { key: "aura-odwagi", classKey: "PALADIN", level: 70, name: "Aura odwagi", effectText: "−15% obrażeń od nieumarłych i demonów przez całą walkę", cooldownTurns: null, oncePerBattle: false },
    { key: "boska-tarcza", classKey: "PALADIN", level: 100, name: "Boska tarcza", effectText: "następne 2 ciosy wroga zadają 0", cooldownTurns: null, oncePerBattle: true },
  ],
  ARCHER: [
    { key: "celny-strzal", classKey: "ARCHER", level: 1, name: "Celny strzał", effectText: "strzał × 1,5, zawsze trafia", cooldownTurns: 4, oncePerBattle: false },
    { key: "zatruta-strzala", classKey: "ARCHER", level: 10, name: "Zatruta strzała", effectText: "Trucizna: 3% PŻ wroga na turę przez 4 tury", cooldownTurns: 5, oncePerBattle: false },
    { key: "odskok", classKey: "ARCHER", level: 25, name: "Odskok", effectText: "po otrzymaniu ciosu 25% szansy na unik następnego", cooldownTurns: null, oncePerBattle: false },
    { key: "grad-strzal", classKey: "ARCHER", level: 45, name: "Grad strzał", effectText: "3 strzały po 50% obrażeń", cooldownTurns: 5, oncePerBattle: false },
    { key: "strzal-w-slaby-punkt", classKey: "ARCHER", level: 70, name: "Strzał w słaby punkt", effectText: "następny cios ma 100% szansy na krytyk", cooldownTurns: 6, oncePerBattle: false },
    { key: "strzala-pradrzewa", classKey: "ARCHER", level: 100, name: "Strzała Pradrzewa", effectText: "strzał × 3, ignoruje obronę", cooldownTurns: null, oncePerBattle: true },
  ],
  ROGUE: [
    { key: "cios-w-plecy", classKey: "ROGUE", level: 1, name: "Cios w plecy", effectText: "jeśli Łotr zaczyna walkę, pierwszy cios × 2", cooldownTurns: null, oncePerBattle: true },
    { key: "jad-na-ostrzach", classKey: "ROGUE", level: 10, name: "Jad na ostrzach", effectText: "ciosy zatruwają: 2% PŻ na turę (do 3 nałożeń)", cooldownTurns: null, oncePerBattle: false },
    { key: "zaslona-dymna", classKey: "ROGUE", level: 25, name: "Zasłona dymna", effectText: "+30% uniku przez 2 tury", cooldownTurns: 5, oncePerBattle: false },
    { key: "taniec-ostrzy", classKey: "ROGUE", level: 45, name: "Taniec ostrzy", effectText: "4 ciosy po 50% obrażeń", cooldownTurns: 5, oncePerBattle: false },
    { key: "cienisty-krok", classKey: "ROGUE", level: 70, name: "Cienisty krok", effectText: "po uniku następny cios jako Cień, × 1,5", cooldownTurns: null, oncePerBattle: false },
    { key: "egzekucja", classKey: "ROGUE", level: 100, name: "Egzekucja", effectText: "wróg poniżej 15% PŻ ginie natychmiast (bossowie: cios × 3)", cooldownTurns: null, oncePerBattle: true },
  ],
  MAGE: [
    { key: "pocisk-mocy", classKey: "MAGE", level: 1, name: "Pocisk mocy", effectText: "zaklęcie × 1,5", cooldownTurns: 4, oncePerBattle: false },
    { key: "magiczna-tarcza", classKey: "MAGE", level: 10, name: "Magiczna tarcza", effectText: "pochłania obrażenia równe 20% PŻ Maga", cooldownTurns: 6, oncePerBattle: false },
    { key: "spowolnienie", classKey: "MAGE", level: 25, name: "Spowolnienie", effectText: "wróg traci co drugą turę przez 4 tury", cooldownTurns: 7, oncePerBattle: false },
    { key: "zaklecie-zywiolu", classKey: "MAGE", level: 45, name: "Kula ognia / Lodowa włócznia / Łańcuch błyskawic", effectText: "zaklęcie × 2 swojego żywiołu; lód dodatkowo −20% inicjatywy wroga", cooldownTurns: 5, oncePerBattle: false },
    { key: "przeciazenie-many", classKey: "MAGE", level: 70, name: "Przeciążenie many", effectText: "+30% obrażeń zaklęć przez 3 tury, potem 1 tura przerwy", cooldownTurns: 8, oncePerBattle: false },
    { key: "gniazdo-meteorow", classKey: "MAGE", level: 100, name: "Gniazdo meteorów", effectText: "zaklęcie × 3, ignoruje odporności", cooldownTurns: null, oncePerBattle: true },
  ],
  PRIEST: [
    { key: "swiety-plomien", classKey: "PRIEST", level: 1, name: "Święty płomień", effectText: "cios Światłem × 1,4", cooldownTurns: 4, oncePerBattle: false },
    { key: "odnowa", classKey: "PRIEST", level: 10, name: "Odnowa", effectText: "leczy 6% PŻ na turę przez 3 tury", cooldownTurns: 6, oncePerBattle: false },
    { key: "oczyszczenie", classKey: "PRIEST", level: 25, name: "Oczyszczenie", effectText: "zdejmuje truciznę, klątwę lub krwawienie", cooldownTurns: 4, oncePerBattle: false },
    { key: "kara-niebios", classKey: "PRIEST", level: 45, name: "Kara niebios", effectText: "nieumarli i demony: cios × 2,5", cooldownTurns: 5, oncePerBattle: false },
    { key: "modlitwa-ochronna", classKey: "PRIEST", level: 70, name: "Modlitwa ochronna", effectText: "−25% otrzymywanych obrażeń przez 3 tury", cooldownTurns: 7, oncePerBattle: false },
    { key: "wskrzeszenie", classKey: "PRIEST", level: 100, name: "Wskrzeszenie", effectText: "po spadku do 0 PŻ wraca z 30% PŻ", cooldownTurns: null, oncePerBattle: true },
  ],
};

export function getAbility(key: string): AbilityDefinition | undefined {
  for (const list of Object.values(ABILITIES)) {
    const found = list.find((a) => a.key === key);
    if (found) return found;
  }
  return undefined;
}

export function abilitiesForClass(classKey: ClassKey): AbilityDefinition[] {
  return ABILITIES[classKey];
}
