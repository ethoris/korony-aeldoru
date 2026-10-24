import type { Element, MonsterType } from "@/game/combat/types";

export interface MonsterDefinition {
  key: string;
  name: string;
  level: number;
  zoneKey: string;
  type: MonsterType;
  isBoss: boolean;
  /** +25% obrażeń tego żywiołu. */
  weakTo: Element[];
  /** −40% obrażeń tego żywiołu. */
  resistTo: Element[];
}

// docs/gdd/04-bestiariusz.md – PŻ/Atak/Obrona liczy jeden wzór (formulas.ts),
// tu tylko to, co wzór nie wylicza: poziom, typ i żywioły.
export const MONSTERS: MonsterDefinition[] = [
  // Szepczący Las (1–10)
  { key: "wsciekly-szczur", name: "Wściekły szczur", level: 1, zoneKey: "szepczacy-las", type: "animal", isBoss: false, weakTo: ["fire"], resistTo: [] },
  { key: "lesny-pajak", name: "Leśny pająk", level: 2, zoneKey: "szepczacy-las", type: "animal", isBoss: false, weakTo: ["fire"], resistTo: ["poison"] },
  { key: "szary-wilk", name: "Szary wilk", level: 3, zoneKey: "szepczacy-las", type: "animal", isBoss: false, weakTo: ["fire"], resistTo: [] },
  { key: "goblin-zbieracz", name: "Goblin zbieracz", level: 5, zoneKey: "szepczacy-las", type: "humanoid", isBoss: false, weakTo: ["fire"], resistTo: [] },
  { key: "bandyta-z-traktu", name: "Bandyta z traktu", level: 7, zoneKey: "szepczacy-las", type: "humanoid", isBoss: false, weakTo: [], resistTo: [] },
  { key: "dzik-klownik", name: "Dzik kłownik", level: 9, zoneKey: "szepczacy-las", type: "animal", isBoss: false, weakTo: ["poison"], resistTo: [] },
  { key: "szczerbaty-krul", name: "Szczerbaty Krul, wódz goblinów", level: 10, zoneKey: "szepczacy-las", type: "humanoid", isBoss: true, weakTo: ["fire"], resistTo: [] },

  // Bagna Mglistej Wieży (11–25)
  { key: "topielec", name: "Topielec", level: 12, zoneKey: "bagna-mglistej-wiezy", type: "undead", isBoss: false, weakTo: ["lightning", "light"], resistTo: ["ice", "poison"] },
  { key: "jaszczuroczlek-lowca", name: "Jaszczuroczłek łowca", level: 14, zoneKey: "bagna-mglistej-wiezy", type: "humanoid", isBoss: false, weakTo: ["lightning", "ice"], resistTo: ["poison"] },
  { key: "szkielet-wojownik", name: "Szkielet wojownik", level: 16, zoneKey: "bagna-mglistej-wiezy", type: "undead", isBoss: false, weakTo: ["light", "physical"], resistTo: ["poison", "shadow"] },
  { key: "bagienna-wiedzma", name: "Bagienna wiedźma", level: 18, zoneKey: "bagna-mglistej-wiezy", type: "humanoid", isBoss: false, weakTo: ["light"], resistTo: ["poison", "shadow"] },
  { key: "morwena", name: "Morwena, Królowa Bagien", level: 20, zoneKey: "bagna-mglistej-wiezy", type: "undead", isBoss: true, weakTo: ["light", "fire"], resistTo: ["ice", "poison"] },
  { key: "ghul", name: "Ghul", level: 22, zoneKey: "bagna-mglistej-wiezy", type: "undead", isBoss: false, weakTo: ["light", "fire"], resistTo: ["poison"] },
  { key: "bledny-ognik", name: "Błędny ognik", level: 24, zoneKey: "bagna-mglistej-wiezy", type: "elemental", isBoss: false, weakTo: ["ice"], resistTo: ["physical"] },

  // Szczyty Żelaznych Gór (26–45)
  { key: "gorski-troll", name: "Górski troll", level: 27, zoneKey: "szczyty-zelaznych-gor", type: "giant", isBoss: false, weakTo: ["fire"], resistTo: [] },
  { key: "gorrag-dwuglowy", name: "Gorrag Dwugłowy", level: 30, zoneKey: "szczyty-zelaznych-gor", type: "giant", isBoss: true, weakTo: ["fire"], resistTo: ["poison"] },
  { key: "ogr-rozbojnik", name: "Ogr rozbójnik", level: 32, zoneKey: "szczyty-zelaznych-gor", type: "giant", isBoss: false, weakTo: ["lightning"], resistTo: [] },
  { key: "gryf", name: "Gryf", level: 35, zoneKey: "szczyty-zelaznych-gor", type: "beast", isBoss: false, weakTo: ["lightning"], resistTo: [] },
  { key: "kamienny-straznik", name: "Kamienny strażnik", level: 38, zoneKey: "szczyty-zelaznych-gor", type: "construct", isBoss: false, weakTo: ["lightning", "physical"], resistTo: ["poison", "fire"] },
  { key: "matka-gryfow", name: "Matka Gryfów Szarych Turni", level: 40, zoneKey: "szczyty-zelaznych-gor", type: "beast", isBoss: true, weakTo: ["lightning"], resistTo: ["ice"] },
  { key: "szronowa-harpia", name: "Szronowa harpia", level: 42, zoneKey: "szczyty-zelaznych-gor", type: "beast", isBoss: false, weakTo: ["fire"], resistTo: ["ice"] },
  { key: "kret-kruszyciel", name: "Kret-kruszyciel", level: 45, zoneKey: "szczyty-zelaznych-gor", type: "beast", isBoss: false, weakTo: ["ice"], resistTo: ["physical"] },

  // Ruiny Starego Imperium (46–70)
  { key: "ruiniczny-golem", name: "Runiczny golem", level: 48, zoneKey: "ruiny-starego-imperium", type: "construct", isBoss: false, weakTo: ["lightning", "physical"], resistTo: ["fire", "ice", "poison"] },
  { key: "archiwista-velnor", name: "Archiwista Velnor", level: 50, zoneKey: "ruiny-starego-imperium", type: "undead", isBoss: true, weakTo: ["light"], resistTo: ["shadow", "poison"] },
  { key: "upior-maga", name: "Upiór maga", level: 53, zoneKey: "ruiny-starego-imperium", type: "undead", isBoss: false, weakTo: ["light"], resistTo: ["shadow", "poison", "physical"] },
  { key: "mroczny-elf-zabojca", name: "Mroczny elf zabójca", level: 58, zoneKey: "ruiny-starego-imperium", type: "humanoid", isBoss: false, weakTo: ["light"], resistTo: ["shadow"] },
  { key: "cesarzowa-bez-twarzy", name: "Cesarzowa Bez Twarzy", level: 60, zoneKey: "ruiny-starego-imperium", type: "undead", isBoss: true, weakTo: ["light"], resistTo: ["shadow", "poison"] },
  { key: "mimik-skarbca", name: "Mimik skarbca", level: 63, zoneKey: "ruiny-starego-imperium", type: "beast", isBoss: false, weakTo: ["fire"], resistTo: [] },
  { key: "przeklety-legionista", name: "Przeklęty legionista", level: 65, zoneKey: "ruiny-starego-imperium", type: "undead", isBoss: false, weakTo: ["light"], resistTo: ["poison"] },
  { key: "straznik-chimera", name: "Strażnik-chimera", level: 68, zoneKey: "ruiny-starego-imperium", type: "beast", isBoss: false, weakTo: ["ice"], resistTo: ["fire", "poison"] },
  { key: "kolos-zlotej-bramy", name: "Kolos Złotej Bramy", level: 70, zoneKey: "ruiny-starego-imperium", type: "construct", isBoss: true, weakTo: ["lightning"], resistTo: ["poison", "fire", "ice"] },

  // Smocze Pustkowia (71–100)
  { key: "wiwerna", name: "Wiwerna", level: 73, zoneKey: "smocze-pustkowia", type: "dragon", isBoss: false, weakTo: ["ice"], resistTo: ["poison"] },
  { key: "popielny-ogar", name: "Popielny ogar", level: 76, zoneKey: "smocze-pustkowia", type: "demon", isBoss: false, weakTo: ["ice", "light"], resistTo: ["fire"] },
  { key: "ignar-popielna-luska", name: "Ignar Popielna Łuska", level: 80, zoneKey: "smocze-pustkowia", type: "dragon", isBoss: true, weakTo: ["ice"], resistTo: ["fire"] },
  { key: "smoczy-kultysta", name: "Smoczy kultysta", level: 83, zoneKey: "smocze-pustkowia", type: "humanoid", isBoss: false, weakTo: ["ice"], resistTo: ["fire"] },
  { key: "magmowy-zywiolak", name: "Magmowy żywiołak", level: 86, zoneKey: "smocze-pustkowia", type: "elemental", isBoss: false, weakTo: ["ice"], resistTo: ["fire", "poison"] },
  { key: "hezrath", name: "Hezrath, Książę Siarki", level: 90, zoneKey: "smocze-pustkowia", type: "demon", isBoss: true, weakTo: ["light"], resistTo: ["fire", "shadow"] },
  { key: "rogaty-demon", name: "Rogaty demon", level: 93, zoneKey: "smocze-pustkowia", type: "demon", isBoss: false, weakTo: ["light", "ice"], resistTo: ["fire"] },
  { key: "mlody-smok", name: "Młody smok", level: 96, zoneKey: "smocze-pustkowia", type: "dragon", isBoss: false, weakTo: ["ice"], resistTo: ["fire"] },
  // Vaelstrax: 3 fazy (ogień/burza/cień), każda ze swoją słabością i odpornością –
  // niereprezentowalne jedną parą weakTo/resistTo; silnik faz dojdzie z mechaniką bossa.
  { key: "vaelstrax", name: "Vaelstrax, Ostatni Smoczy Król", level: 100, zoneKey: "smocze-pustkowia", type: "dragon", isBoss: true, weakTo: [], resistTo: [] },

  // Otchłań Pękniętej Korony (101–120)
  { key: "smocze-widmo", name: "Smocze widmo", level: 101, zoneKey: "otchlan-peknietej-korony", type: "undead", isBoss: false, weakTo: ["light"], resistTo: ["physical", "fire"] },
  { key: "straznik-otchlani", name: "Strażnik Otchłani", level: 103, zoneKey: "otchlan-peknietej-korony", type: "construct", isBoss: false, weakTo: ["lightning"], resistTo: ["shadow"] },
  { key: "archidemon", name: "Archidemon", level: 106, zoneKey: "otchlan-peknietej-korony", type: "demon", isBoss: false, weakTo: ["light"], resistTo: ["fire", "shadow"] },
  { key: "sedzia-peknietego-tronu", name: "Sędzia Pękniętego Tronu", level: 110, zoneKey: "otchlan-peknietej-korony", type: "undead", isBoss: true, weakTo: ["light"], resistTo: ["shadow", "poison"] },
  { key: "koronny-upior", name: "Koronny upiór", level: 113, zoneKey: "otchlan-peknietej-korony", type: "undead", isBoss: false, weakTo: ["light"], resistTo: ["shadow"] },
  { key: "pustkowiec", name: "Pustkowiec", level: 116, zoneKey: "otchlan-peknietej-korony", type: "elemental", isBoss: false, weakTo: ["physical"], resistTo: ["fire", "ice", "lightning"] },
  { key: "pomiot-otchlani", name: "Pomiot Otchłani", level: 118, zoneKey: "otchlan-peknietej-korony", type: "demon", isBoss: false, weakTo: ["light", "fire"], resistTo: ["poison"] },
  // Pierwotny Smok: 4 fazy, inna słabość/ochrona w każdej – jak Vaelstrax, zob. wyżej.
  { key: "pierwotny-smok", name: "Pierwotny Smok", level: 120, zoneKey: "otchlan-peknietej-korony", type: "dragon", isBoss: true, weakTo: [], resistTo: [] },
];

export function getMonster(key: string): MonsterDefinition {
  const monster = MONSTERS.find((m) => m.key === key);
  if (!monster) {
    throw new Error(`Nieznany potwór: ${key}`);
  }
  return monster;
}

export function getBossByLevel(level: number): MonsterDefinition {
  const boss = MONSTERS.find((m) => m.isBoss && m.level === level);
  if (!boss) {
    throw new Error(`Nie ma bossa na poziomie ${level}`);
  }
  return boss;
}
