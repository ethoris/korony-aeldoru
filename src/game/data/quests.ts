// docs/gdd/06-zadania.md – zadania rozdziałów I–II (zakres wersji 1).
//
// Uproszczenia względem tekstu GDD (scenki z wyborem nie mają tu gałęzi):
// - liczniki "wygranych" są liczone dla CAŁEJ lokacji, nie dla konkretnego
//   gatunku potwora (GDD czasem podaje "5 pająków" – u nas to "5 wygranych
//   w tej lokacji");
// - scenki z wyborem (np. "zabij / śledź / przekup") nie mają gałęzi – zadanie
//   zalicza się na tych samych warunkach, nagroda jak w tabeli bez wariantu;
// - "nagrody specjalne" zlecenia, które wymagają jeszcze nieistniejących
//   systemów (sklep, liczniki czasowe) są zapisywane jako informacja, ale
//   nie mają jeszcze mechanicznego efektu – patrz `special.active`.
export type QuestConditionType = "WIN_COUNT" | "DEEP_WIN" | "BOSS_DEFEAT" | "FIND_ITEM";

export interface QuestCondition {
  type: QuestConditionType;
  target?: number;
  chance?: number;
  bossKey?: string;
}

export type SpecialRewardKey =
  | "STAMINA_30"
  | "BLESSING"
  | "SHORTCUT"
  | "TREASURE_MAP"
  | "DISCOUNT"
  | "GOLD_BONUS";

export interface QuestDefinition {
  key: string;
  chapter: 1 | 2;
  locationKey: string;
  kind: "STORY" | "COMMISSION";
  title: string;
  summary: string;
  condition: QuestCondition;
  isChapterFinale?: boolean;
  /** Tylko dla zadań fabularnych: co drugie daje przedmiot dla klasy gracza. */
  storyOrder?: number;
  special?: { key: SpecialRewardKey; label: string; active: boolean };
}

export const QUESTS: QuestDefinition[] = [
  // --- Rozdział I: Popioły na trakcie (Szepczący Las) ---
  {
    key: "szczurza-robota",
    chapter: 1,
    locationKey: "piwnice-karczmy",
    kind: "STORY",
    title: "Szczurza robota",
    summary: "Pokonaj 5 szczurów; w gnieździe znajdujesz zakrwawiony list kupca.",
    condition: { type: "WIN_COUNT", target: 5 },
    storyOrder: 1,
  },
  {
    key: "beczka-miodu",
    chapter: 1,
    locationKey: "piwnice-karczmy",
    kind: "COMMISSION",
    title: "Beczka miodu",
    summary: "Znajdź beczkę miodu w łupach dla karczmarza.",
    condition: { type: "FIND_ITEM", chance: 0.2 },
    special: { key: "DISCOUNT", label: "Znajomość: −10% w sklepie", active: false },
  },
  {
    key: "slady-na-pniach",
    chapter: 1,
    locationKey: "polana-drwali",
    kind: "STORY",
    title: "Ślady na pniach",
    summary: "8 wygranych; drwal Bogdan mówi, że wilki ktoś przegania z lasu.",
    condition: { type: "WIN_COUNT", target: 8 },
    storyOrder: 2,
  },
  {
    key: "siekiera-dziadka",
    chapter: 1,
    locationKey: "polana-drwali",
    kind: "COMMISSION",
    title: "Siekiera dziadka",
    summary: "5 wygranych z pająkami.",
    condition: { type: "WIN_COUNT", target: 5 },
    special: { key: "TREASURE_MAP", label: "Mapa skarbu", active: false },
  },
  {
    key: "kto-przegania-wilki",
    chapter: 1,
    locationKey: "wilcze-wykroty",
    kind: "STORY",
    title: "Kto przegania wilki",
    summary: "10 wygranych i scena z goblinem noszącym królewską pieczęć.",
    condition: { type: "WIN_COUNT", target: 10 },
    storyOrder: 3,
  },
  {
    key: "wilcza-skora",
    chapter: 1,
    locationKey: "wilcze-wykroty",
    kind: "COMMISSION",
    title: "Wilcza skóra na zimę",
    summary: "6 wygranych z wilkami dla wdowy.",
    condition: { type: "WIN_COUNT", target: 6 },
    special: { key: "STAMINA_30", label: "+30 wytrwałości od razu", active: true },
  },
  {
    key: "pusta-skrzynia",
    chapter: 1,
    locationKey: "kupiecki-trakt",
    kind: "STORY",
    title: "Pusta skrzynia",
    summary: "Głęboka wyprawa; w rozbitym wozie część starej mapy.",
    condition: { type: "DEEP_WIN" },
    storyOrder: 4,
  },
  {
    key: "zaginiony-syn-kupca",
    chapter: 1,
    locationKey: "kupiecki-trakt",
    kind: "COMMISSION",
    title: "Zaginiony syn kupca",
    summary: "8 wygranych z bandytami.",
    condition: { type: "WIN_COUNT", target: 8 },
    special: { key: "GOLD_BONUS", label: "Dodatkowe złoto", active: false },
  },
  {
    key: "szczerbaty-krul-finale",
    chapter: 1,
    locationKey: "goblinia-nora",
    kind: "STORY",
    title: "Szczerbaty Krul",
    summary: "Pokonaj wodza goblinów i odzyskaj fragment mapy prowadzącej na bagna.",
    condition: { type: "BOSS_DEFEAT", bossKey: "szczerbaty-krul" },
    isChapterFinale: true,
    storyOrder: 5,
  },
  {
    key: "zlote-zeby",
    chapter: 1,
    locationKey: "goblinia-nora",
    kind: "COMMISSION",
    title: "Złote zęby",
    summary: "10 wygranych z goblinami.",
    condition: { type: "WIN_COUNT", target: 10 },
    special: { key: "BLESSING", label: "Błogosławieństwo", active: false },
  },

  // --- Rozdział II: Wieża we mgle (Bagna Mglistej Wieży) ---
  {
    key: "swiatla-pod-woda",
    chapter: 2,
    locationKey: "zatopiona-wioska",
    kind: "STORY",
    title: "Światła pod wodą",
    summary: "8 wygranych; topielcy idą w stronę wieży.",
    condition: { type: "WIN_COUNT", target: 8 },
    storyOrder: 1,
  },
  {
    key: "dzwon-z-kaplicy",
    chapter: 2,
    locationKey: "zatopiona-wioska",
    kind: "COMMISSION",
    title: "Dzwon z kaplicy",
    summary: "5 wygranych z topielcami.",
    condition: { type: "WIN_COUNT", target: 5 },
    special: { key: "BLESSING", label: "Błogosławieństwo", active: false },
  },
  {
    key: "luskowaci-przewodnicy",
    chapter: 2,
    locationKey: "trzcinowe-ostepy",
    kind: "STORY",
    title: "Łuskowaci przewodnicy",
    summary: "Scena z jaszczuroludźmi, którzy pokazują drogę przez trzciny.",
    condition: { type: "WIN_COUNT", target: 8 },
    storyOrder: 2,
  },
  {
    key: "jaja-w-gniezdzie",
    chapter: 2,
    locationKey: "trzcinowe-ostepy",
    kind: "COMMISSION",
    title: "Jaja w gnieździe",
    summary: "6 wygranych z jaszczuroludźmi.",
    condition: { type: "WIN_COUNT", target: 6 },
    special: { key: "SHORTCUT", label: "Skrót: −30% czasu wypraw w tej lokacji na 24 h", active: false },
  },
  {
    key: "puste-groby",
    chapter: 2,
    locationKey: "cmentarz-bezimiennych",
    kind: "STORY",
    title: "Puste groby",
    summary: "10 wygranych; na płytach wyryto ten sam znak co na mapie.",
    condition: { type: "WIN_COUNT", target: 10 },
    storyOrder: 3,
  },
  {
    key: "imie-dla-zmarlego",
    chapter: 2,
    locationKey: "cmentarz-bezimiennych",
    kind: "COMMISSION",
    title: "Imię dla zmarłego",
    summary: "Znajdź Medalion w łupach.",
    condition: { type: "FIND_ITEM", chance: 0.2 },
    special: { key: "GOLD_BONUS", label: "+3% PD na stałe w Bagnach", active: false },
  },
  {
    key: "krolowa-bagien",
    chapter: 2,
    locationKey: "chata-matki-ropuch",
    kind: "STORY",
    title: "Królowa Bagien",
    summary: "Pokonaj Morwenę; jej kocioł pokazuje drogę przez groblę.",
    condition: { type: "BOSS_DEFEAT", bossKey: "morwena" },
    storyOrder: 4,
  },
  {
    key: "przepis-matki-ropuch",
    chapter: 2,
    locationKey: "chata-matki-ropuch",
    kind: "COMMISSION",
    title: "Przepis Matki Ropuch",
    summary: "5 wygranych z wiedźmami.",
    condition: { type: "WIN_COUNT", target: 5 },
    special: { key: "DISCOUNT", label: "Przepis na mikstury za 40% ceny", active: false },
  },
  {
    key: "droga-przez-mgle",
    chapter: 2,
    locationKey: "mglista-grobla",
    kind: "STORY",
    title: "Droga przez mgłę",
    summary: "Głęboka wyprawa; ratujesz kapłankę Solarisa uwięzioną przez ghule.",
    condition: { type: "DEEP_WIN" },
    storyOrder: 5,
  },
  {
    key: "zgubiona-latarnia",
    chapter: 2,
    locationKey: "mglista-grobla",
    kind: "COMMISSION",
    title: "Zgubiona latarnia",
    summary: "8 wygranych z ognikami.",
    condition: { type: "WIN_COUNT", target: 8 },
    special: { key: "TREASURE_MAP", label: "Mapa skarbu", active: false },
  },
  {
    key: "ucieczka-nekromanty",
    chapter: 2,
    locationKey: "podnoze-mglistej-wiezy",
    kind: "STORY",
    title: "Ucieczka nekromanty",
    summary: "Przebij się przez straż wieży; nekromanta ucieka, zostawiając dziennik.",
    condition: { type: "WIN_COUNT", target: 10 },
    isChapterFinale: true,
    storyOrder: 6,
  },
  {
    key: "ksiega-zaklec",
    chapter: 2,
    locationKey: "podnoze-mglistej-wiezy",
    kind: "COMMISSION",
    title: "Księga zaklęć",
    summary: "Scena w bibliotece wieży.",
    condition: { type: "WIN_COUNT", target: 8 },
    special: { key: "GOLD_BONUS", label: "300 złota", active: true },
  },
];

export const CHAPTER_REWARDS: Record<1 | 2, { goldBonus: number; titleKey?: string; titleName?: string }> = {
  1: { goldBonus: 500 },
  2: { goldBonus: 0, titleKey: "pogromca-mgiel", titleName: "Pogromca Mgieł" },
};

export function questsForLocation(locationKey: string): QuestDefinition[] {
  return QUESTS.filter((q) => q.locationKey === locationKey);
}

export function getQuest(key: string): QuestDefinition {
  const quest = QUESTS.find((q) => q.key === key);
  if (!quest) throw new Error(`Nieznane zadanie: ${key}`);
  return quest;
}

/** Zadanie fabularne, które musi być ukończone, by odblokować tę lokację (null = brak wymogu). */
export function storyQuestUnlocking(locationKey: string): QuestDefinition | null {
  const LOCATION_ORDER = [
    "piwnice-karczmy",
    "polana-drwali",
    "wilcze-wykroty",
    "kupiecki-trakt",
    "goblinia-nora",
    "zatopiona-wioska",
    "trzcinowe-ostepy",
    "cmentarz-bezimiennych",
    "chata-matki-ropuch",
    "mglista-grobla",
    "podnoze-mglistej-wiezy",
  ];
  const index = LOCATION_ORDER.indexOf(locationKey);
  if (index <= 0) return null;
  const previousLocationKey = LOCATION_ORDER[index - 1];
  return QUESTS.find((q) => q.locationKey === previousLocationKey && q.kind === "STORY") ?? null;
}
