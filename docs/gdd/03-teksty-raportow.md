# Teksty raportów

## Zasady

Raport składa się z linii: jedna linia na akcję (atak, blok, zdolność, mikstura), każda losowana z puli pasującej do sytuacji. Na wersję 1 wystarcza pula poniżej (ok. 110 linii); dopisujemy kolejne bez zmiany kodu, bo teksty są w pliku danych.

**Znaczniki** w tekstach, podmieniane przez kod:

| Znacznik | Co wstawia | Przykład |
| --- | --- | --- |
| {A} | imię atakującego, mianownik | Aldric / Szary wilk |
| {C} | imię celu, mianownik | Szary wilk / Aldric |
| {OBR} | liczba obrażeń z poprawną odmianą | 1 obrażenie, 23 obrażenia, 25 obrażeń |
| {ZYW} | nazwa żywiołu w narzędniku | ogniem, lodem, błyskawicą, światłem, cieniem, trucizną |
| {LECZ} | wyleczone PŻ z odmianą | 120 punktów życia |

**Polska odmiana.** Teksty są ułożone tak, żeby imiona występowały tylko w mianowniku i tylko jako podmiot zdania, a czasowniki zawsze w czasie teraźniejszym (bez form „zdążył / zdążyła”). Dzięki temu imiona graczy nie wymagają odmiany ani znajomości płci bohatera. Liczebnik odmienia funkcja w kodzie:

- 1 → „obrażenie”
- końcówka 2, 3, 4 (ale nie 12, 13, 14) → „obrażenia”
- pozostałe → „obrażeń”

Nazwy potworów w pliku danych mają 4 formy (mianownik, dopełniacz, biernik, narzędnik), na wypadek tekstów fabularnych, gdzie mianownik nie wystarczy.

**Losowanie:** linia wybierana ziarnem walki (raport da się odtworzyć), bez powtórzenia tej samej linii dwa razy z rzędu w jednym raporcie. Linie mają maks. ok. 140 znaków, żeby mieściły się w 2–3 wierszach na telefonie.

**Formatowanie:** liczby obrażeń pogrubione i w kolorze żywiołu, krytyk z ikoną, imię gracza złotem, nazwa potwora czerwienią (kolory z zakładki Wygląd).

## Ataki gracza

Po 3 trafienia, 2 pudła i 2 krytyki na każdy typ broni.

| Broń | Wynik | Tekst |
| --- | --- | --- |
| Dwuręczna | trafienie | {A} unosi broń nad głowę i spada nią z całej siły. {C} chwieje się pod ciosem – {OBR}. |
| Dwuręczna | trafienie | {A} bierze szeroki zamach i trafia w bok. {C} traci {OBR}. |
| Dwuręczna | trafienie | {A} wbija ostrze z obrotu, jak przy rąbaniu drewna. {C} dostaje {OBR}. |
| Dwuręczna | pudło | {A} bierze zamach, ale ciężka broń grzęźnie w ziemi. {C} odskakuje bez szwanku. |
| Dwuręczna | pudło | {A} tnie ze świstem tuż obok. {C} uchyla się w ostatniej chwili. |
| Dwuręczna | krytyk | {A} ryczy i uderza z siłą lawiny! Pancerz pęka jak skorupka – {C} traci {OBR}! |
| Dwuręczna | krytyk | {A} znajduje szczelinę w obronie i wbija ostrze głęboko! {C} dostaje {OBR}! |
| Miecz i tarcza | trafienie | {A} pcha tarczą, a zaraz za nią idzie krótkie pchnięcie mieczem. {C} traci {OBR}. |
| Miecz i tarcza | trafienie | {A} tnie równo i dokładnie, jak na placu ćwiczeń. {C} dostaje {OBR}. |
| Miecz i tarcza | trafienie | {A} przyjmuje cios na tarczę i odpowiada kontrą. {C} traci {OBR}. |
| Miecz i tarcza | pudło | {A} tnie zbyt ostrożnie, a ostrze ślizga się po pancerzu. {C} nawet tego nie czuje. |
| Miecz i tarcza | pudło | {A} wychodzi zza tarczy o sekundę za późno. {C} już się odsuwa. |
| Miecz i tarcza | krytyk | {A} wybija wroga z równowagi tarczą i tnie w odsłonięte miejsce! {C} traci {OBR}! |
| Miecz i tarcza | krytyk | {A} opuszcza miecz z góry jak wyrok! {C} dostaje {OBR}! |
| Łuk | trafienie | Cięciwa brzęczy – {A} trafia w ramię. {C} traci {OBR}. |
| Łuk | trafienie | {A} strzela w biegu, nie zwalniając kroku. {C} dostaje {OBR}. |
| Łuk | trafienie | {A} wypuszcza dwie strzały jedna po drugiej; druga trafia. {C} traci {OBR}. |
| Łuk | pudło | {A} strzela, ale strzała wbija się w drzewo za celem. {C} nawet się nie odwraca. |
| Łuk | pudło | {A} chybia o włos, bo wiatr znosi strzałę. {C} rusza dalej. |
| Łuk | krytyk | {A} wstrzymuje oddech i puszcza cięciwę w idealnej chwili! Strzała trafia w szczelinę hełmu – {C} traci {OBR}! |
| Łuk | krytyk | {A} przebija pancerz strzałą na wylot! {C} dostaje {OBR}! |
| Sztylety | trafienie | {A} wślizguje się pod gardę i dwa razy tnie po żebrach. {C} traci {OBR}. |
| Sztylety | trafienie | {A} tnie dwoma ostrzami, które migają jak srebrne ryby. {C} dostaje {OBR}. |
| Sztylety | trafienie | {A} znika z pola widzenia i pojawia się za plecami. {C} traci {OBR}. |
| Sztylety | pudło | {A} skacze do przodu, ale trafia tylko w płaszcz. {C} cofa się na czas. |
| Sztylety | pudło | {A} dźga, ale sztylet odbija się od klamry pasa. {C} uśmiecha się krzywo. |
| Sztylety | krytyk | {A} znajduje lukę między płytami pancerza i wbija ostrze aż po rękojeść! {C} traci {OBR}! |
| Sztylety | krytyk | Cień, błysk, cięcie – {A} uderza szybciej niż myśl! {C} dostaje {OBR}! |
| Zaklęcia | trafienie | {A} kreśli runę w powietrzu i uderza {ZYW}. {C} traci {OBR}. |
| Zaklęcia | trafienie | {A} wypowiada słowa mocy, które zamieniają się w pocisk. {C} dostaje {OBR}. |
| Zaklęcia | trafienie | {A} uderza kosturem o ziemię i posyła falę magii. {C} traci {OBR}. |
| Zaklęcia | pudło | {A} rzuca zaklęcie, ale gaśnie ono w połowie drogi. {C} otrząsa się z iskier. |
| Zaklęcia | pudło | {A} myli jedną sylabę i pocisk rozbija się o skałę. {C} wykorzystuje chwilę. |
| Zaklęcia | krytyk | {A} rozpala runy na kosturze jak słońce i uderza z pełną mocą! {C} traci {OBR}! |
| Zaklęcia | krytyk | {A} uwalnia całą zgromadzoną magię naraz! {C} dostaje {OBR}! |
| Buława | trafienie | {A} wymierza cios buławą z cichą modlitwą na ustach. {C} traci {OBR}. |
| Buława | trafienie | {A} trafia ciężką głowicą buławy w bark. {C} dostaje {OBR}. |
| Buława | trafienie | {A} uderza świętym symbolem wyrytym na buławie. {C} traci {OBR}. |
| Buława | pudło | {A} zgniata buławą tylko kamień pod nogami. {C} schodzi z linii ciosu. |
| Buława | pudło | {A} zbyt długo się modli i cios przychodzi za późno. {C} już się odsuwa. |
| Buława | krytyk | {A} uderza z siłą boskiego gniewu! Słychać trzask kości – {C} traci {OBR}! |
| Buława | krytyk | {A} woła imię swojego bóstwa i uderza w samo serce wroga! {C} dostaje {OBR}! |

## Ataki potworów

Po 3 trafienia i 1 pudło na każdy typ potwora z bestiariusza. Krytyk potwora to zwykłe trafienie z dopiskiem z tekstów ogólnych. Bossowie dostaną własne linie w aktualizacjach.

| Typ | Wynik | Tekst |
| --- | --- | --- |
| Zwierzę | trafienie | {A} skacze i zatapia kły w ramieniu. {C} traci {OBR}. |
| Zwierzę | trafienie | {A} szarpie pazurami po nogach. {C} dostaje {OBR}. |
| Zwierzę | trafienie | {A} rzuca się z warkotem prosto do gardła. {C} traci {OBR}. |
| Zwierzę | pudło | {A} kłapie zębami w powietrzu. {C} odpycha bestię butem. |
| Humanoid | trafienie | {A} tnie zardzewiałym ostrzem z wrzaskiem. {C} traci {OBR}. |
| Humanoid | trafienie | {A} rzuca piachem w oczy i zaraz potem uderza. {C} dostaje {OBR}. |
| Humanoid | trafienie | {A} wali pałką na oślep i tym razem trafia. {C} traci {OBR}. |
| Humanoid | pudło | {A} potyka się o własne nogi. {C} nie wierzy własnemu szczęściu. |
| Nieumarły | trafienie | {A} wyciąga zimne palce i rozdrapuje skórę do krwi. {C} traci {OBR}. |
| Nieumarły | trafienie | {A} uderza z siłą, której żywe ciało nie powinno mieć. {C} dostaje {OBR}. |
| Nieumarły | trafienie | {A} wydaje upiorny jęk, od którego krzepnie krew w żyłach. {C} traci {OBR}. |
| Nieumarły | pudło | {A} sięga po ofiarę, ale kości trzeszczą i ruch wychodzi za wolno. {C} odsuwa się z obrzydzeniem. |
| Olbrzym | trafienie | {A} zamachuje się pniem drzewa jak maczugą. {C} leci kilka kroków w tył i traci {OBR}. |
| Olbrzym | trafienie | {A} tupie, a ziemia pęka pod stopami. {C} dostaje {OBR}. |
| Olbrzym | trafienie | {A} chwyta wielką dłonią i ściska. {C} traci {OBR}. |
| Olbrzym | pudło | {A} uderza w miejsce, gdzie przed chwilą stał wróg. Ziemia drży, ale {C} jest już obok. |
| Bestia | trafienie | {A} spada z góry z rozpostartymi skrzydłami. {C} traci {OBR}. |
| Bestia | trafienie | {A} chlaszcze ogonem z kolcami. {C} dostaje {OBR}. |
| Bestia | trafienie | {A} zatapia dziób i szpony naraz. {C} traci {OBR}. |
| Bestia | pudło | {A} nurkuje zbyt nisko i ryje ziemię. {C} turla się w bok. |
| Konstrukt | trafienie | {A} wyprowadza kamienny cios z mechaniczną precyzją. {C} traci {OBR}. |
| Konstrukt | trafienie | {A} rozżarza runy na piersi i uderza falą mocy. {C} dostaje {OBR}. |
| Konstrukt | trafienie | {A} miażdży wszystko, co stoi na drodze. {C} traci {OBR}. |
| Konstrukt | pudło | {A} wykonuje ruch zapisany sto lat temu, ale cel jest już gdzie indziej. {C} uchodzi bez szwanku. |
| Żywiołak | trafienie | {A} uderza czystym żywiołem {ZYW}. {C} traci {OBR}. |
| Żywiołak | trafienie | {A} wybucha falą żaru lub mrozu wokół siebie. {C} dostaje {OBR}. |
| Żywiołak | trafienie | {A} owija się wokół celu i ściska. {C} traci {OBR}. |
| Żywiołak | pudło | {A} rozlewa się szeroko, ale cel stoi poza zasięgiem. {C} łapie oddech. |
| Demon | trafienie | {A} śmieje się i tnie szponami pełnymi siarki. {C} traci {OBR}. |
| Demon | trafienie | {A} szepcze imię, a ból przychodzi znikąd. {C} dostaje {OBR}. |
| Demon | trafienie | {A} bije płonącym batem. {C} traci {OBR}. |
| Demon | pudło | {A} kusi i zwodzi, ale tym razem bez skutku. {C} odpędza szept z głowy. |
| Smok | trafienie | {A} zieje ogniem, który topi kamień. {C} traci {OBR}. |
| Smok | trafienie | {A} uderza łapą wielkości wozu. {C} dostaje {OBR}. |
| Smok | trafienie | {A} kłapie paszczą pełną zębów jak miecze. {C} traci {OBR}. |
| Smok | pudło | {A} unosi się na skrzydłach i uderza w pustkę. {C} chowa się za skałą. |

## Teksty ogólne

W tej części {A} to zawsze bohater gracza, a {C} przeciwnik, chyba że wiersz mówi inaczej. Dodatkowe znaczniki: {ZDOL} (nazwa zdolności), {MIKS} (nazwa mikstury), {LUP} (lista łupów), {PD} i {ZLOTO} (liczby z odmianą).

| Sytuacja | Tekst |
| --- | --- |
| Początek walki | {A} wchodzi na polanę. Spomiędzy drzew wyłania się {C}. |
| Początek walki | Ciszę przerywa szelest. {C} zagradza drogę, a {A} dobywa broni. |
| Początek walki | {A} czuje na karku czyjś wzrok. {C} atakuje bez ostrzeżenia. |
| Początek walki (boss) | Ziemia drży. {C} wychodzi z cienia, a {A} wie, że ta walka zostanie w pieśniach. |
| Blok tarczą | {A} przyjmuje cios na tarczę. Drewno trzeszczy, ale wytrzymuje. |
| Blok tarczą | {A} podstawia tarczę w ostatniej chwili. {C} uderza w pustą stal. |
| Blok tarczą | Głuchy huk – {A} odbija atak krawędzią tarczy. |
| Unik | {A} robi pół kroku w bok i cios przelatuje obok. |
| Unik | {A} pochyla się nisko; ostrze przecina tylko powietrze. |
| Unik | {A} jest tam, gdzie {C} nie patrzy. |
| Krytyk potwora (dopisek) | To był straszny cios! |
| Krytyk potwora (dopisek) | Pancerz nie pomaga – cios trafia w najsłabsze miejsce! |
| Słabość na żywioł | {C} wyje z bólu – {ZYW} rani podwójnie! |
| Odporność na żywioł | {C} ledwo czuje uderzenie, {ZYW} niewiele tu zdziała. |
| Zdolność | {A} używa zdolności {ZDOL}! |
| Zdolność | Teraz! {A} sięga po {ZDOL}. |
| Mikstura życia | {A} wypija {MIKS} jednym haustem i odzyskuje {LECZ}. |
| Eliksir | {A} wypija {MIKS}. Ciepło rozlewa się po ciele. |
| Antidotum lub woda święcona | {A} wypija {MIKS} i czuje, jak słabość ustępuje. |
| Trucizna (co turę) | Trucizna pali w żyłach: {C} traci {OBR}. |
| Krwawienie (co turę) | Rana krwawi: {C} traci {OBR}. |
| Ogłuszenie | {C} zatacza się w oszołomieniu i traci turę. |
| Tarcza magiczna | {A} osłania się błękitną tarczą, która pochłania cios. |
| Zwycięstwo | {C} pada. {A} ociera pot z czoła. Zwycięstwo! Zdobywasz {PD} i {ZLOTO}. |
| Zwycięstwo | Ostatni cios i cisza. {A} wygrywa! Zdobywasz {PD} i {ZLOTO}. |
| Zwycięstwo | {C} ucieka w popłochu, ale nie zdąża daleko. Zwycięstwo! Zdobywasz {PD} i {ZLOTO}. |
| Łup | Wśród szczątków błyszczy coś cennego: {LUP}. |
| Łup | {A} przeszukuje pobojowisko i znajduje: {LUP}. |
| Porażka | Świat ciemnieje. {A} budzi się w obozie: siniaki, ból i żadnych łupów. |
| Porażka | {A} pada na kolana. Tym razem przewaga jest po drugiej stronie. Wróć, gdy wyleczysz rany. |
| Porażka | Ostatnim wysiłkiem {A} wycofuje się z walki resztkami sił. |
| Remis (limit tur) | Obie strony słaniają się na nogach. {C} wycofuje się w cień, a {A} nie ma sił gonić. |
| Remis (limit tur) | Walka trwa zbyt długo. {A} i {C} rozchodzą się, każde w swoją stronę. |
| Odwrót (taktyka) | {A} wycofuje się na czas, zanim będzie za późno. Lepiej żyć i walczyć jutro. |
| Odwrót (taktyka) | {A} rzuca się w zarośla i ucieka. Łup przepada, ale rany są płytkie. |
