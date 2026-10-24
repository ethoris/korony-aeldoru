/** Mapa prowincji (docs/gdd/10-prowincje.md): 50 prowincji w 5 regionach po 10, stolica Valmor neutralna i niezdobywalna. */

export type ResourceBonusKind = "wood" | "stone" | "iron" | "food" | "goldTax";

export interface ProvinceDefinition {
  key: string;
  name: string;
  region: 1 | 2 | 3 | 4 | 5;
  regionName: string;
  zone: 1 | 2 | 3 | 4 | 5;
  /** +10% jednego surowca (albo podatku złota) – null, gdy to bonus specjalny opisany w bonusText. */
  resourceBonus: ResourceBonusKind | null;
  /** Bonus specjalny strefy 4-5, działa dla całej gildii właściciela (docs/gdd/10-prowincje.md). Tekstowy – jeszcze nie wliczony w inne systemy. */
  bonusText: string;
}

/** Garnizon NPC = 200 × numer strefy; podatek dla właściciela = % produkcji regionu (docs/gdd/10-prowincje.md). */
export const ZONE_GARRISON: Record<number, number> = { 1: 200, 2: 400, 3: 600, 4: 800, 5: 1000 };
export const ZONE_TAX_PERCENT: Record<number, number> = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 8 };

const REGION_NAMES: Record<number, string> = {
  1: "Marchia Północna",
  2: "Dolina Srebrnej Rzeki",
  3: "Ziemie Koronne",
  4: "Wybrzeże Zachodnie",
  5: "Południowe Stepy",
};

function p(
  key: string,
  name: string,
  region: 1 | 2 | 3 | 4 | 5,
  zone: 1 | 2 | 3 | 4 | 5,
  resourceBonus: ResourceBonusKind | null,
  bonusText: string,
): ProvinceDefinition {
  return { key, name, region, regionName: REGION_NAMES[region], zone, resourceBonus, bonusText };
}

export const PROVINCES: ProvinceDefinition[] = [
  // Region I: Marchia Północna
  p("wilczy-kres", "Wilczy Kres", 1, 1, "wood", "+10% drewna"),
  p("mrozna-straznica", "Mroźna Strażnica", 1, 1, "iron", "+10% żelaza"),
  p("przelecz-gryfow", "Przełęcz Gryfów", 1, 1, "stone", "+10% kamienia"),
  p("sosnowy-grod", "Sosnowy Gród", 1, 2, "wood", "+10% drewna"),
  p("kopalnie-hartu", "Kopalnie Hartu", 1, 2, "iron", "+10% żelaza"),
  p("ostrow-krukow", "Ostrów Kruków", 1, 2, "food", "+10% żywności"),
  p("szara-twierdza", "Szara Twierdza", 1, 2, "stone", "+10% kamienia"),
  p("brzozowa-marchia", "Brzozowa Marchia", 1, 3, "wood", "+10% drewna"),
  p("krance-zelaznych-gor", "Krańce Żelaznych Gór", 1, 3, "iron", "+10% żelaza"),
  p("bastion-polnocy", "Bastion Północy", 1, 4, null, "specjalny: −5% czasu szkolenia wojska dla gildii"),

  // Region II: Dolina Srebrnej Rzeki
  p("trzcinowe-brzegi", "Trzcinowe Brzegi", 2, 1, "food", "+10% żywności"),
  p("rybackie-osady", "Rybackie Osady", 2, 1, "food", "+10% żywności"),
  p("mglisty-brod", "Mglisty Bród", 2, 1, "wood", "+10% drewna"),
  p("mlynska-dolina", "Młyńska Dolina", 2, 2, "food", "+10% żywności"),
  p("srebrny-port", "Srebrny Port", 2, 2, "stone", "+10% kamienia"),
  p("wierzbowy-gaj", "Wierzbowy Gaj", 2, 2, "wood", "+10% drewna"),
  p("zlota-przystan", "Złota Przystań", 2, 2, "goldTax", "+5% podatku od handlu dla właściciela"),
  p("winnice-ardel", "Winnice Ardel", 2, 3, "food", "+10% żywności"),
  p("kupiecki-most", "Kupiecki Most", 2, 3, "stone", "+10% kamienia"),
  p("srebrne-zrodla", "Srebrne Źródła", 2, 4, null, "specjalny: +5% złota z wypraw dla gildii"),

  // Region III: Ziemie Koronne
  p("krolewski-trakt", "Królewski Trakt", 3, 3, "stone", "+10% kamienia"),
  p("pola-turniejowe", "Pola Turniejowe", 3, 3, "food", "+10% żywności"),
  p("wzgorze-heroldow", "Wzgórze Heroldów", 3, 4, null, "specjalny: +5% sławy z pojedynków dla gildii"),
  p("cytadela-switu", "Cytadela Świtu", 3, 4, null, "specjalny: +10% obrony wojsk gildii"),
  p("mennica-valmoru", "Mennica Valmoru", 3, 4, "goldTax", "+10% złota z podatków"),
  p("wieze-magow-koronnych", "Wieże Magów Koronnych", 3, 4, null, "specjalny: +10% many dla gildii"),
  p("ogrody-krolowej", "Ogrody Królowej", 3, 5, null, "specjalny: −3% czasu wypraw dla gildii"),
  p("zamek-koronny", "Zamek Koronny", 3, 5, null, "specjalny: +3% doświadczenia dla gildii"),
  p("katedra-solarisa", "Katedra Solarisa", 3, 5, null, "specjalny: rana trwa o 20% krócej dla gildii"),
  p("skarbiec-krolestwa", "Skarbiec Królestwa", 3, 5, null, "specjalny: +5% złota z wypraw i bossów dla gildii"),

  // Region IV: Wybrzeże Zachodnie
  p("latarnia-sztormow", "Latarnia Sztormów", 4, 1, "stone", "+10% kamienia"),
  p("zatoka-przemytnikow", "Zatoka Przemytników", 4, 1, "food", "+10% żywności"),
  p("slone-bagna", "Słone Bagna", 4, 1, "wood", "+10% drewna"),
  p("klifowy-grod", "Klifowy Gród", 4, 2, "stone", "+10% kamienia"),
  p("port-mewa", "Port Mewa", 4, 2, "food", "+10% żywności"),
  p("wydmy-bursztynu", "Wydmy Bursztynu", 4, 2, "goldTax", "+10% złota z podatków"),
  p("stocznie-zachodu", "Stocznie Zachodu", 4, 3, "wood", "+10% drewna"),
  p("twierdza-fal", "Twierdza Fal", 4, 3, "iron", "+10% żelaza"),
  p("przyladek-wiatrow", "Przylądek Wiatrów", 4, 3, "stone", "+10% kamienia"),
  p("admiralicja", "Admiralicja", 4, 4, null, "specjalny: −5% czasu marszu wojsk gildii"),

  // Region V: Południowe Stepy
  p("kurhany-przodkow", "Kurhany Przodków", 5, 1, "stone", "+10% kamienia"),
  p("stepowe-pastwiska", "Stepowe Pastwiska", 5, 1, "food", "+10% żywności"),
  p("suche-koryto", "Suche Koryto", 5, 1, "iron", "+10% żelaza"),
  p("oboz-klanu-sokola", "Obóz Klanu Sokoła", 5, 2, "food", "+10% żywności"),
  p("slone-jeziora", "Słone Jeziora", 5, 2, "goldTax", "+10% złota z podatków"),
  p("czerwone-wzgorza", "Czerwone Wzgórza", 5, 2, "iron", "+10% żelaza"),
  p("stadniny-poludnia", "Stadniny Południa", 5, 3, null, "specjalny: −10% kosztu rycerzy dla właściciela"),
  p("gaj-thessy", "Gaj Thessy", 5, 3, "wood", "+10% drewna"),
  p("brama-stepu", "Brama Stepu", 5, 3, "stone", "+10% kamienia"),
  p("wieza-wartownicza-ostrogi", "Wieża Wartownicza Ostrogi", 5, 4, null, "specjalny: +5% siły ataku wojsk gildii"),
];

export const PROVINCE_KEYS = PROVINCES.map((p) => p.key);

export function getProvince(key: string): ProvinceDefinition | undefined {
  return PROVINCES.find((p) => p.key === key);
}

export function provincesInRegion(region: number): ProvinceDefinition[] {
  return PROVINCES.filter((p) => p.region === region);
}
