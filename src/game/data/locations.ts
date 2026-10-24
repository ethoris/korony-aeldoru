// docs/gdd/05-lokacje.md – wersja 1 obejmuje krainy 1–2 (11 lokacji,
// poziomy 1–25). Czas i wytrwałość to wartości z tabeli (liczone wzorem
// z dolnego nagłówka rozdziału, tu przepisane raz jako dane).
export interface LocationDefinition {
  key: string;
  zoneKey: string;
  name: string;
  description: string;
  minLevel: number;
  maxLevel: number;
  timeMinutes: number;
  stamina: number;
  monsterKeys: string[];
  bossKey?: string;
}

export const LOCATIONS: LocationDefinition[] = [
  // 1. Szepczący Las (1–10)
  {
    key: "piwnice-karczmy",
    zoneKey: "szepczacy-las",
    name: "Piwnice Karczmy „Pod Złamanym Kołem”",
    description: "Karczmarz płaci miedziakami za każdego szczura. Pierwsze kroki, pierwsze blizny.",
    minLevel: 1,
    maxLevel: 2,
    timeMinutes: 5,
    stamina: 10,
    monsterKeys: ["wsciekly-szczur", "lesny-pajak"],
  },
  {
    key: "polana-drwali",
    zoneKey: "szepczacy-las",
    name: "Polana Drwali",
    description: "Drwale porzucili siekiery w pniach. Coś wyje między drzewami, gdy słońce się chowa.",
    minLevel: 3,
    maxLevel: 4,
    timeMinutes: 6,
    stamina: 10,
    monsterKeys: ["szary-wilk", "lesny-pajak"],
  },
  {
    key: "wilcze-wykroty",
    zoneKey: "szepczacy-las",
    name: "Wilcze Wykroty",
    description: "Wąwozy pełne kości i porzuconych sideł. Gobliny chętnie podbierają wilkom zdobycz.",
    minLevel: 5,
    maxLevel: 6,
    timeMinutes: 6,
    stamina: 10,
    monsterKeys: ["szary-wilk", "goblin-zbieracz"],
  },
  {
    key: "kupiecki-trakt",
    zoneKey: "szepczacy-las",
    name: "Kupiecki Trakt",
    description: "Rozbite wozy i pusta skrzynia z królewską pieczęcią. Ktoś tu czeka na następną karawanę.",
    minLevel: 7,
    maxLevel: 8,
    timeMinutes: 6,
    stamina: 11,
    monsterKeys: ["bandyta-z-traktu", "dzik-klownik"],
  },
  {
    key: "goblinia-nora",
    zoneKey: "szepczacy-las",
    name: "Goblinia Nora",
    description: "Smród, wrzaski i blask skradzionych monet. Na końcu tunelu siedzi wódz.",
    minLevel: 9,
    maxLevel: 10,
    timeMinutes: 7,
    stamina: 11,
    monsterKeys: ["goblin-zbieracz", "bandyta-z-traktu", "dzik-klownik"],
    bossKey: "szczerbaty-krul",
  },

  // 2. Bagna Mglistej Wieży (11–25)
  {
    key: "zatopiona-wioska",
    zoneKey: "bagna-mglistej-wiezy",
    name: "Zatopiona Wioska",
    description: "Z wody wystają tylko dachy. Nocą w oknach pod powierzchnią palą się światła.",
    minLevel: 11,
    maxLevel: 12,
    timeMinutes: 7,
    stamina: 11,
    monsterKeys: ["topielec", "jaszczuroczlek-lowca"],
  },
  {
    key: "trzcinowe-ostepy",
    zoneKey: "bagna-mglistej-wiezy",
    name: "Trzcinowe Ostępy",
    description: "Labirynt trzcin wyższych niż człowiek. Łuskowaci łowcy znają tu każdą ścieżkę.",
    minLevel: 13,
    maxLevel: 15,
    timeMinutes: 8,
    stamina: 11,
    monsterKeys: ["jaszczuroczlek-lowca", "bledny-ognik"],
  },
  {
    key: "cmentarz-bezimiennych",
    zoneKey: "bagna-mglistej-wiezy",
    name: "Cmentarz Bezimiennych",
    description: "Groby bez nazw i ziemia, która się porusza. Nekromanta szuka tu żołnierzy.",
    minLevel: 16,
    maxLevel: 18,
    timeMinutes: 8,
    stamina: 11,
    monsterKeys: ["szkielet-wojownik", "ghul"],
  },
  {
    key: "chata-matki-ropuch",
    zoneKey: "bagna-mglistej-wiezy",
    name: "Chata Matki Ropuch",
    description: "Chata na kurzych łapach, kocioł wiecznie bulgocze. Wiedźma zna drogę do wieży.",
    minLevel: 19,
    maxLevel: 20,
    timeMinutes: 9,
    stamina: 12,
    monsterKeys: ["bagienna-wiedzma", "topielec"],
    bossKey: "morwena",
  },
  {
    key: "mglista-grobla",
    zoneKey: "bagna-mglistej-wiezy",
    name: "Mglista Grobla",
    description: "Jedyna droga do wieży, wąska i śliska. Mgła gęstnieje z każdym krokiem.",
    minLevel: 21,
    maxLevel: 22,
    timeMinutes: 9,
    stamina: 12,
    monsterKeys: ["ghul", "bledny-ognik", "szkielet-wojownik"],
  },
  {
    key: "podnoze-mglistej-wiezy",
    zoneKey: "bagna-mglistej-wiezy",
    name: "Podnóże Mglistej Wieży",
    description: "Kamienie wieży szepczą imiona umarłych. Na szczycie płonie zielony ogień.",
    minLevel: 23,
    maxLevel: 25,
    timeMinutes: 10,
    stamina: 12,
    monsterKeys: ["ghul", "bagienna-wiedzma", "szkielet-wojownik"],
  },
];

export function getLocation(key: string): LocationDefinition {
  const location = LOCATIONS.find((l) => l.key === key);
  if (!location) throw new Error(`Nieznana lokacja: ${key}`);
  return location;
}
