import type { MonsterType, WeaponType } from "@/game/combat/types";

// docs/gdd/03-teksty-raportow.md – pula tekstów raportu. {A}/{C}/{OBR}/{ZYW}/{LECZ}
// podmienia report.ts; nazwy potworów i gracza zawsze w mianowniku.

export const WEAPON_LINES: Record<WeaponType, { hit: string[]; miss: string[]; crit: string[] }> = {
  twoHanded: {
    hit: [
      "{A} unosi broń nad głowę i spada nią z całej siły. {C} chwieje się pod ciosem – {OBR}.",
      "{A} bierze szeroki zamach i trafia w bok. {C} traci {OBR}.",
      "{A} wbija ostrze z obrotu, jak przy rąbaniu drewna. {C} dostaje {OBR}.",
    ],
    miss: [
      "{A} bierze zamach, ale ciężka broń grzęźnie w ziemi. {C} odskakuje bez szwanku.",
      "{A} tnie ze świstem tuż obok. {C} uchyla się w ostatniej chwili.",
    ],
    crit: [
      "{A} ryczy i uderza z siłą lawiny! Pancerz pęka jak skorupka – {C} traci {OBR}!",
      "{A} znajduje szczelinę w obronie i wbija ostrze głęboko! {C} dostaje {OBR}!",
    ],
  },
  swordShield: {
    hit: [
      "{A} pcha tarczą, a zaraz za nią idzie krótkie pchnięcie mieczem. {C} traci {OBR}.",
      "{A} tnie równo i dokładnie, jak na placu ćwiczeń. {C} dostaje {OBR}.",
      "{A} przyjmuje cios na tarczę i odpowiada kontrą. {C} traci {OBR}.",
    ],
    miss: [
      "{A} tnie zbyt ostrożnie, a ostrze ślizga się po pancerzu. {C} nawet tego nie czuje.",
      "{A} wychodzi zza tarczy o sekundę za późno. {C} już się odsuwa.",
    ],
    crit: [
      "{A} wybija wroga z równowagi tarczą i tnie w odsłonięte miejsce! {C} traci {OBR}!",
      "{A} opuszcza miecz z góry jak wyrok! {C} dostaje {OBR}!",
    ],
  },
  bow: {
    hit: [
      "Cięciwa brzęczy – {A} trafia w ramię. {C} traci {OBR}.",
      "{A} strzela w biegu, nie zwalniając kroku. {C} dostaje {OBR}.",
      "{A} wypuszcza dwie strzały jedna po drugiej; druga trafia. {C} traci {OBR}.",
    ],
    miss: [
      "{A} strzela, ale strzała wbija się w drzewo za celem. {C} nawet się nie odwraca.",
      "{A} chybia o włos, bo wiatr znosi strzałę. {C} rusza dalej.",
    ],
    crit: [
      "{A} wstrzymuje oddech i puszcza cięciwę w idealnej chwili! Strzała trafia w szczelinę hełmu – {C} traci {OBR}!",
      "{A} przebija pancerz strzałą na wylot! {C} dostaje {OBR}!",
    ],
  },
  daggers: {
    hit: [
      "{A} wślizguje się pod gardę i dwa razy tnie po żebrach. {C} traci {OBR}.",
      "{A} tnie dwoma ostrzami, które migają jak srebrne ryby. {C} dostaje {OBR}.",
      "{A} znika z pola widzenia i pojawia się za plecami. {C} traci {OBR}.",
    ],
    miss: [
      "{A} skacze do przodu, ale trafia tylko w płaszcz. {C} cofa się na czas.",
      "{A} dźga, ale sztylet odbija się od klamry pasa. {C} uśmiecha się krzywo.",
    ],
    crit: [
      "{A} znajduje lukę między płytami pancerza i wbija ostrze aż po rękojeść! {C} traci {OBR}!",
      "Cień, błysk, cięcie – {A} uderza szybciej niż myśl! {C} dostaje {OBR}!",
    ],
  },
  spells: {
    hit: [
      "{A} kreśli runę w powietrzu i uderza {ZYW}. {C} traci {OBR}.",
      "{A} wypowiada słowa mocy, które zamieniają się w pocisk. {C} dostaje {OBR}.",
      "{A} uderza kosturem o ziemię i posyła falę magii. {C} traci {OBR}.",
    ],
    miss: [
      "{A} rzuca zaklęcie, ale gaśnie ono w połowie drogi. {C} otrząsa się z iskier.",
      "{A} myli jedną sylabę i pocisk rozbija się o skałę. {C} wykorzystuje chwilę.",
    ],
    crit: [
      "{A} rozpala runy na kosturze jak słońce i uderza z pełną mocą! {C} traci {OBR}!",
      "{A} uwalnia całą zgromadzoną magię naraz! {C} dostaje {OBR}!",
    ],
  },
  mace: {
    hit: [
      "{A} wymierza cios buławą z cichą modlitwą na ustach. {C} traci {OBR}.",
      "{A} trafia ciężką głowicą buławy w bark. {C} dostaje {OBR}.",
      "{A} uderza świętym symbolem wyrytym na buławie. {C} traci {OBR}.",
    ],
    miss: [
      "{A} zgniata buławą tylko kamień pod nogami. {C} schodzi z linii ciosu.",
      "{A} zbyt długo się modli i cios przychodzi za późno. {C} już się odsuwa.",
    ],
    crit: [
      "{A} uderza z siłą boskiego gniewu! Słychać trzask kości – {C} traci {OBR}!",
      "{A} woła imię swojego bóstwa i uderza w samo serce wroga! {C} dostaje {OBR}!",
    ],
  },
};

export const MONSTER_LINES: Record<MonsterType, { hit: string[]; miss: string[] }> = {
  animal: {
    hit: [
      "{A} skacze i zatapia kły w ramieniu. {C} traci {OBR}.",
      "{A} szarpie pazurami po nogach. {C} dostaje {OBR}.",
      "{A} rzuca się z warkotem prosto do gardła. {C} traci {OBR}.",
    ],
    miss: ["{A} kłapie zębami w powietrzu. {C} odpycha bestię butem."],
  },
  humanoid: {
    hit: [
      "{A} tnie zardzewiałym ostrzem z wrzaskiem. {C} traci {OBR}.",
      "{A} rzuca piachem w oczy i zaraz potem uderza. {C} dostaje {OBR}.",
      "{A} wali pałką na oślep i tym razem trafia. {C} traci {OBR}.",
    ],
    miss: ["{A} potyka się o własne nogi. {C} nie wierzy własnemu szczęściu."],
  },
  undead: {
    hit: [
      "{A} wyciąga zimne palce i rozdrapuje skórę do krwi. {C} traci {OBR}.",
      "{A} uderza z siłą, której żywe ciało nie powinno mieć. {C} dostaje {OBR}.",
      "{A} wydaje upiorny jęk, od którego krzepnie krew w żyłach. {C} traci {OBR}.",
    ],
    miss: ["{A} sięga po ofiarę, ale kości trzeszczą i ruch wychodzi za wolno. {C} odsuwa się z obrzydzeniem."],
  },
  giant: {
    hit: [
      "{A} zamachuje się pniem drzewa jak maczugą. {C} leci kilka kroków w tył i traci {OBR}.",
      "{A} tupie, a ziemia pęka pod stopami. {C} dostaje {OBR}.",
      "{A} chwyta wielką dłonią i ściska. {C} traci {OBR}.",
    ],
    miss: ["{A} uderza w miejsce, gdzie przed chwilą stał wróg. Ziemia drży, ale {C} jest już obok."],
  },
  beast: {
    hit: [
      "{A} spada z góry z rozpostartymi skrzydłami. {C} traci {OBR}.",
      "{A} chlaszcze ogonem z kolcami. {C} dostaje {OBR}.",
      "{A} zatapia dziób i szpony naraz. {C} traci {OBR}.",
    ],
    miss: ["{A} nurkuje zbyt nisko i ryje ziemię. {C} turla się w bok."],
  },
  construct: {
    hit: [
      "{A} wyprowadza kamienny cios z mechaniczną precyzją. {C} traci {OBR}.",
      "{A} rozżarza runy na piersi i uderza falą mocy. {C} dostaje {OBR}.",
      "{A} miażdży wszystko, co stoi na drodze. {C} traci {OBR}.",
    ],
    miss: ["{A} wykonuje ruch zapisany sto lat temu, ale cel jest już gdzie indziej. {C} uchodzi bez szwanku."],
  },
  elemental: {
    hit: [
      "{A} uderza czystym żywiołem {ZYW}. {C} traci {OBR}.",
      "{A} wybucha falą żaru lub mrozu wokół siebie. {C} dostaje {OBR}.",
      "{A} owija się wokół celu i ściska. {C} traci {OBR}.",
    ],
    miss: ["{A} rozlewa się szeroko, ale cel stoi poza zasięgiem. {C} łapie oddech."],
  },
  demon: {
    hit: [
      "{A} śmieje się i tnie szponami pełnymi siarki. {C} traci {OBR}.",
      "{A} szepcze imię, a ból przychodzi znikąd. {C} dostaje {OBR}.",
      "{A} bije płonącym batem. {C} traci {OBR}.",
    ],
    miss: ["{A} kusi i zwodzi, ale tym razem bez skutku. {C} odpędza szept z głowy."],
  },
  dragon: {
    hit: [
      "{A} zieje ogniem, który topi kamień. {C} traci {OBR}.",
      "{A} uderza łapą wielkości wozu. {C} dostaje {OBR}.",
      "{A} kłapie paszczą pełną zębów jak miecze. {C} traci {OBR}.",
    ],
    miss: ["{A} unosi się na skrzydłach i uderza w pustkę. {C} chowa się za skałą."],
  },
};

export const GENERAL_LINES = {
  battleStart: [
    "{A} wchodzi na polanę. Spomiędzy drzew wyłania się {C}.",
    "Ciszę przerywa szelest. {C} zagradza drogę, a {A} dobywa broni.",
    "{A} czuje na karku czyjś wzrok. {C} atakuje bez ostrzeżenia.",
  ],
  battleStartBoss: ["Ziemia drży. {C} wychodzi z cienia, a {A} wie, że ta walka zostanie w pieśniach."],
  shieldBlock: [
    "{A} przyjmuje cios na tarczę. Drewno trzeszczy, ale wytrzymuje.",
    "{A} podstawia tarczę w ostatniej chwili. {C} uderza w pustą stal.",
    "Głuchy huk – {A} odbija atak krawędzią tarczy.",
  ],
  dodge: [
    "{A} robi pół kroku w bok i cios przelatuje obok.",
    "{A} pochyla się nisko; ostrze przecina tylko powietrze.",
    "{A} jest tam, gdzie {C} nie patrzy.",
  ],
  monsterCritSuffix: ["To był straszny cios!", "Pancerz nie pomaga – cios trafia w najsłabsze miejsce!"],
  weaknessLine: ["{C} wyje z bólu – {ZYW} rani podwójnie!"],
  resistLine: ["{C} ledwo czuje uderzenie, {ZYW} niewiele tu zdziała."],
  ability: ["{A} używa zdolności {ZDOL}!", "Teraz! {A} sięga po {ZDOL}."],
  healPotion: ["{A} wypija {MIKS} jednym haustem i odzyskuje {LECZ}."],
  healSelf: ["{A} skupia się i odzyskuje {LECZ}."],
  poisonTick: ["Trucizna pali w żyłach: {C} traci {OBR}."],
  bleedTick: ["Rana krwawi: {C} traci {OBR}."],
  stun: ["{C} zatacza się w oszołomieniu i traci turę."],
  magicShield: ["{A} osłania się błękitną tarczą, która pochłania cios."],
  victory: [
    "{C} pada. {A} ociera pot z czoła. Zwycięstwo! Zdobywasz {PD} i {ZLOTO}.",
    "Ostatni cios i cisza. {A} wygrywa! Zdobywasz {PD} i {ZLOTO}.",
    "{C} ucieka w popłochu, ale nie zdąża daleko. Zwycięstwo! Zdobywasz {PD} i {ZLOTO}.",
  ],
  loot: ["Wśród szczątków błyszczy coś cennego: {LUP}.", "{A} przeszukuje pobojowisko i znajduje: {LUP}."],
  defeat: [
    "Świat ciemnieje. {A} budzi się w obozie: siniaki, ból i żadnych łupów.",
    "{A} pada na kolana. Tym razem przewaga jest po drugiej stronie. Wróć, gdy wyleczysz rany.",
    "Ostatnim wysiłkiem {A} wycofuje się z walki resztkami sił.",
  ],
  draw: [
    "Obie strony słaniają się na nogach. {C} wycofuje się w cień, a {A} nie ma sił gonić.",
    "Walka trwa zbyt długo. {A} i {C} rozchodzą się, każde w swoją stronę.",
  ],
  retreat: [
    "{A} wycofuje się na czas, zanim będzie za późno. Lepiej żyć i walczyć jutro.",
    "{A} rzuca się w zarośla i ucieka. Łup przepada, ale rany są płytkie.",
  ],
};
