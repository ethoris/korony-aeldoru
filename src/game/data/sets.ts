import type { ClassKey } from "@/game/combat/types";

/**
 * Zestawy klasowe (docs/gdd/08-ekwipunek.md): 6 klas × 2 zestawy (poz. 50 i
 * poz. 100) × 5 części. Ta wersja zawiera pełne dane (nazwy, staty, premie)
 * i wiąże premię za 2 części (prosty % bonus) w combatLoadout.ts.
 *
 * NIE wdrożone jeszcze (świadomie, zakres uzgodniony z Patrykiem):
 * - premia za 4 części i za pełny zestaw (5 cz.) – to 12 różnych unikalnych
 *   mechanik (DoT, proc-e, zmiana mnożnika krytyka, przerwanie ulepszeń
 *   zdolności itd.), nie jeden wzór; tekst efektu jest zapisany (`fourPieceBonusText`,
 *   `fivePieceBonusText`), ale silnik walki go jeszcze nie odczytuje
 * - upuszczanie części z bossów (GDD: "każdy boss upuszcza inne części",
 *   bez dokładnego przypisania część→boss) – wymaga decyzji, którego bossa
 *   przypisać do której części; do tej pory gracz nie może jeszcze zdobyć
 *   żadnej części w grze
 */

export type SetPieceSlot = "WEAPON" | "HELMET" | "ARMOR" | "GLOVES" | "BOOTS";

export interface SetPiece {
  slot: SetPieceSlot;
  name: string;
  mainTraitText: string;
}

export type SetTwoPieceBonus =
  | { kind: "damagePercent"; value: number }
  | { kind: "armorPercent"; value: number }
  | { kind: "critPercent"; value: number }
  | { kind: "healPercent"; value: number }
  | { kind: "textOnly"; text: string };

export interface SetDefinition {
  key: string;
  classKey: ClassKey;
  tier: 1 | 2;
  level: 50 | 100;
  name: string;
  flavorText: string;
  pieces: SetPiece[];
  twoPieceBonus: SetTwoPieceBonus;
  fourPieceBonusText: string;
  fivePieceBonusText: string;
}

export const SETS: Record<string, SetDefinition> = {
  "wojownik-i": {
    key: "wojownik-i",
    classKey: "WARRIOR",
    tier: 1,
    level: 50,
    name: "Gniew Żelaznej Przełęczy",
    flavorText: "Wykuty z żelaza gór, pachnie dymem kuźni.",
    pieces: [
      { slot: "WEAPON", name: "Topór Przełęczy", mainTraitText: "obrażenia 185–250" },
      { slot: "HELMET", name: "Rogaty Szyszak", mainTraitText: "+18 SIŁ" },
      { slot: "ARMOR", name: "Kirys Kowala Gór", mainTraitText: "pancerz 26" },
      { slot: "GLOVES", name: "Kolczaste Karwasze", mainTraitText: "+6% krytyka" },
      { slot: "BOOTS", name: "Okute Trzewiki", mainTraitText: "+15 WYT" },
    ],
    twoPieceBonus: { kind: "damagePercent", value: 8 },
    fourPieceBonusText: "każde trafienie krytyczne daje +5% ataku do końca walki (maks. 5 razy)",
    fivePieceBonusText: "przy 30% PŻ jeden darmowy cios × 2",
  },
  "wojownik-ii": {
    key: "wojownik-ii",
    classKey: "WARRIOR",
    tier: 2,
    level: 100,
    name: "Wściekłość Popielnego Tytana",
    flavorText: "Z łusek i kości Ignara Popielnej Łuski.",
    pieces: [
      { slot: "WEAPON", name: "Miecz Tytana", mainTraitText: "obrażenia 355–480" },
      { slot: "HELMET", name: "Korona Popiołu", mainTraitText: "+38 SIŁ" },
      { slot: "ARMOR", name: "Napierśnik z Łusek", mainTraitText: "pancerz 52" },
      { slot: "GLOVES", name: "Pięści Żaru", mainTraitText: "+10% krytyka" },
      { slot: "BOOTS", name: "Stąpacze Zgliszcz", mainTraitText: "+32 WYT" },
    ],
    twoPieceBonus: { kind: "damagePercent", value: 12 },
    fourPieceBonusText: "ciosy podpalają: 3% PŻ wroga na turę przez 3 tury",
    fivePieceBonusText: "Szał Tytana: poniżej 50% PŻ ataki ignorują 30% obrony wroga",
  },
  "paladyn-i": {
    key: "paladyn-i",
    classKey: "PALADIN",
    tier: 1,
    level: 50,
    name: "Przysięga Świtu",
    flavorText: "Pobłogosławiony w świątyni Solarisa.",
    pieces: [
      { slot: "WEAPON", name: "Miecz Pierwszego Promienia", mainTraitText: "obrażenia 85–110, tarcza blok +5%" },
      { slot: "HELMET", name: "Hełm Strażnika Świtu", mainTraitText: "+18 WYT" },
      { slot: "ARMOR", name: "Zbroja Przysięgi", mainTraitText: "pancerz 16" },
      { slot: "GLOVES", name: "Rękawice Świętej Dłoni", mainTraitText: "+10% leczenia" },
      { slot: "BOOTS", name: "Nagolenniki Pielgrzyma", mainTraitText: "+12 SIŁ" },
    ],
    twoPieceBonus: { kind: "armorPercent", value: 10 },
    fourPieceBonusText: "leczenie raz na walkę przywraca dodatkowo 10% PŻ",
    fivePieceBonusText: "Aura Świtu: nieumarli zadają −20% obrażeń",
  },
  "paladyn-ii": {
    key: "paladyn-ii",
    classKey: "PALADIN",
    tier: 2,
    level: 100,
    name: "Bastion Złotej Bramy",
    flavorText: "Z kawałków Kolosa Złotej Bramy, przekuty przez kapłanów.",
    pieces: [
      { slot: "WEAPON", name: "Młot Bramy", mainTraitText: "obrażenia 160–215, tarcza blok +8%" },
      { slot: "HELMET", name: "Przyłbica Kolosa", mainTraitText: "+38 WYT" },
      { slot: "ARMOR", name: "Pancerz Bastionu", mainTraitText: "pancerz 31" },
      { slot: "GLOVES", name: "Złote Dłonie Sądu", mainTraitText: "+15% leczenia" },
      { slot: "BOOTS", name: "Stopy Fundamentu", mainTraitText: "+25 SIŁ" },
    ],
    twoPieceBonus: { kind: "armorPercent", value: 15 },
    fourPieceBonusText: "każdy zablokowany cios leczy 3% PŻ",
    fivePieceBonusText: "Niezłomność: raz na walkę śmiertelny cios zostawia 1 PŻ",
  },
  "lucznik-i": {
    key: "lucznik-i",
    classKey: "ARCHER",
    tier: 1,
    level: 50,
    name: "Pióro Szarych Turni",
    flavorText: "Z piór Matki Gryfów, lekki jak wiatr.",
    pieces: [
      { slot: "WEAPON", name: "Łuk Gryfiego Lotu", mainTraitText: "obrażenia 120–165" },
      { slot: "HELMET", name: "Kaptur Wiatrołowcy", mainTraitText: "+18 ZRĘ" },
      { slot: "ARMOR", name: "Kurta z Piór", mainTraitText: "pancerz 21" },
      { slot: "GLOVES", name: "Rękawice Cięciwy", mainTraitText: "+5% celności" },
      { slot: "BOOTS", name: "Buty Turni", mainTraitText: "+10 inicjatywy" },
    ],
    twoPieceBonus: { kind: "damagePercent", value: 8 },
    fourPieceBonusText: "darmowy strzał przed walką zadaje +30% obrażeń",
    fivePieceBonusText: "Oko Gryfa: 15% szansy na drugi strzał w turze",
  },
  "lucznik-ii": {
    key: "lucznik-ii",
    classKey: "ARCHER",
    tier: 2,
    level: 100,
    name: "Ostatnia Strzała Leśnego Rodu",
    flavorText: "Z drewna drzewa, które pamięta pierwszych królów.",
    pieces: [
      { slot: "WEAPON", name: "Łuk Pradrzewa", mainTraitText: "obrażenia 230–315" },
      { slot: "HELMET", name: "Wieniec Strażnika Puszczy", mainTraitText: "+38 ZRĘ" },
      { slot: "ARMOR", name: "Płaszcz z Kory", mainTraitText: "pancerz 41" },
      { slot: "GLOVES", name: "Dłonie Łowczyni", mainTraitText: "+9% celności" },
      { slot: "BOOTS", name: "Ciche Mokasyny", mainTraitText: "+20 inicjatywy" },
    ],
    twoPieceBonus: { kind: "damagePercent", value: 12 },
    fourPieceBonusText: "każde trafienie oznacza wroga: kolejne strzały +4% obrażeń (maks. 5 znaków)",
    fivePieceBonusText: "Deszcz Strzał: co 4 tury trzy strzały naraz po 60% obrażeń",
  },
  "lotr-i": {
    key: "lotr-i",
    classKey: "ROGUE",
    tier: 1,
    level: 50,
    name: "Szept Cienia",
    flavorText: "Noszony przez gildię złodziei z ruin stolicy.",
    pieces: [
      { slot: "WEAPON", name: "Bliźniacze Sztylety Szeptu", mainTraitText: "obrażenia 70–95 (×2 ataki)" },
      { slot: "HELMET", name: "Maska bez Twarzy", mainTraitText: "+18 ZRĘ" },
      { slot: "ARMOR", name: "Skórznia Nocy", mainTraitText: "pancerz 21" },
      { slot: "GLOVES", name: "Zręczne Palce", mainTraitText: "+8% krytyka" },
      { slot: "BOOTS", name: "Kroki Kota", mainTraitText: "+8% uniku" },
    ],
    twoPieceBonus: { kind: "critPercent", value: 6 },
    fourPieceBonusText: "krytyk zadaje × 1,8 zamiast × 1,5",
    fivePieceBonusText: "Znikanie: po uniku następny cios zawsze krytyczny",
  },
  "lotr-ii": {
    key: "lotr-ii",
    classKey: "ROGUE",
    tier: 2,
    level: 100,
    name: "Jad Księcia Siarki",
    flavorText: "Ostrza hartowane we krwi Hezratha.",
    pieces: [
      { slot: "WEAPON", name: "Kły Siarki", mainTraitText: "obrażenia 135–180 (×2 ataki)" },
      { slot: "HELMET", name: "Kaptur Popiołu", mainTraitText: "+38 ZRĘ" },
      { slot: "ARMOR", name: "Kurtka Dymu", mainTraitText: "pancerz 41" },
      { slot: "GLOVES", name: "Trujące Rękawice", mainTraitText: "+12% krytyka" },
      { slot: "BOOTS", name: "Buty Zgliszcz", mainTraitText: "+12% uniku" },
    ],
    twoPieceBonus: { kind: "textOnly", text: "ciosy zatruwają: 2% PŻ wroga na turę (do 5 nałożeń)" },
    fourPieceBonusText: "+20% obrażeń przeciw zatrutym wrogom",
    fivePieceBonusText: "Pocałunek Siarki: wróg poniżej 20% PŻ ginie od krytyka",
  },
  "mag-i": {
    key: "mag-i",
    classKey: "MAGE",
    tier: 1,
    level: 50,
    name: "Szaty Archiwisty",
    flavorText: "Z biblioteki Archiwisty Velnora, wciąż szumią szeptem ksiąg.",
    pieces: [
      { slot: "WEAPON", name: "Kostur Zapomnianych Stron", mainTraitText: "obrażenia zaklęć 170–230" },
      { slot: "HELMET", name: "Kaptur Uczonego", mainTraitText: "+18 INT" },
      { slot: "ARMOR", name: "Szata Inkaustu", mainTraitText: "pancerz 16" },
      { slot: "GLOVES", name: "Mitenki Skryby", mainTraitText: "+8% skuteczności zaklęć" },
      { slot: "BOOTS", name: "Pantofle Ciszy", mainTraitText: "+10 WYT" },
    ],
    twoPieceBonus: { kind: "damagePercent", value: 8 },
    fourPieceBonusText: "na początku walki tarcza magiczna pochłaniająca 150 obrażeń",
    fivePieceBonusText: "Zakazany Rozdział: co 4 tury zaklęcie trafia podwójnie",
  },
  "mag-ii": {
    key: "mag-ii",
    classKey: "MAGE",
    tier: 2,
    level: 100,
    name: "Gwiezdny Splot",
    flavorText: "Utkany ze światła gwiazd w wieży Ilyry.",
    pieces: [
      { slot: "WEAPON", name: "Berło Spadającej Gwiazdy", mainTraitText: "obrażenia zaklęć 330–445" },
      { slot: "HELMET", name: "Diadem Konstelacji", mainTraitText: "+38 INT" },
      { slot: "ARMOR", name: "Płaszcz Nocnego Nieba", mainTraitText: "pancerz 31" },
      { slot: "GLOVES", name: "Dłonie Komety", mainTraitText: "+14% skuteczności zaklęć" },
      { slot: "BOOTS", name: "Stąpacze Orbity", mainTraitText: "+22 WYT" },
    ],
    twoPieceBonus: { kind: "damagePercent", value: 12 },
    fourPieceBonusText: "każde zaklęcie ma 10% szansy na drugie, darmowe",
    fivePieceBonusText: "Deszcz Meteorów: raz na walkę zaklęcie × 3, ignoruje odporności",
  },
  "kaplan-i": {
    key: "kaplan-i",
    classKey: "PRIEST",
    tier: 1,
    level: 50,
    name: "Szaty Pogromcy Mgieł",
    flavorText: "Po raz pierwszy noszone przy oczyszczeniu Bagien Mglistej Wieży.",
    pieces: [
      { slot: "WEAPON", name: "Buława Rozproszenia", mainTraitText: "obrażenia 95–130, +25% przeciw nieumarłym" },
      { slot: "HELMET", name: "Mitra Czuwania", mainTraitText: "+18 INT" },
      { slot: "ARMOR", name: "Ornat Mglistej Wieży", mainTraitText: "pancerz 23" },
      { slot: "GLOVES", name: "Rękawice Błogosławieństwa", mainTraitText: "+10% leczenia" },
      { slot: "BOOTS", name: "Sandały Pielgrzymki", mainTraitText: "+14 WYT" },
    ],
    twoPieceBonus: { kind: "healPercent", value: 10 },
    fourPieceBonusText: "leczenie nadwyżką ponad pełne PŻ daje tarczę (maks. 10% PŻ)",
    fivePieceBonusText: "Oczyszczenie: leczenie zdejmuje jedną klątwę lub truciznę",
  },
  "kaplan-ii": {
    key: "kaplan-ii",
    classKey: "PRIEST",
    tier: 2,
    level: 100,
    name: "Relikwie Pierwszego Świętego",
    flavorText: "Odnalezione w krypcie pod ruinami stolicy.",
    pieces: [
      { slot: "WEAPON", name: "Kadzielnica Wiecznego Płomienia", mainTraitText: "obrażenia 185–250, +30% przeciw nieumarłym i demonom" },
      { slot: "HELMET", name: "Aureola z Brązu", mainTraitText: "+38 INT" },
      { slot: "ARMOR", name: "Całun Męczennika", mainTraitText: "pancerz 47" },
      { slot: "GLOVES", name: "Dłonie Uzdrowiciela", mainTraitText: "+16% leczenia" },
      { slot: "BOOTS", name: "Ścieżka Pokuty", mainTraitText: "+28 WYT" },
    ],
    twoPieceBonus: { kind: "healPercent", value: 15 },
    fourPieceBonusText: "leczenie co 2 tury zamiast co 3",
    fivePieceBonusText: "Cud: raz na walkę po spadku do 0 PŻ wraca z 40% PŻ",
  },
};

export const SET_KEYS = Object.keys(SETS);

export function setsForClass(classKey: ClassKey): SetDefinition[] {
  return Object.values(SETS).filter((s) => s.classKey === classKey);
}

/** templateKey przedmiotu zestawu: "<setKey>:<slot>" – patrz item.templateKey w schema.prisma. */
export function setTemplateKey(setKey: string, slot: SetPieceSlot): string {
  return `${setKey}:${slot}`;
}

export function parseSetTemplateKey(templateKey: string | null): { setKey: string; slot: SetPieceSlot } | null {
  if (!templateKey || !templateKey.includes(":")) return null;
  const [setKey, slot] = templateKey.split(":");
  if (!SETS[setKey]) return null;
  return { setKey, slot: slot as SetPieceSlot };
}
