# Bestiariusz

## Zasady

Bestiariusz ma 36 zwykłych potworów i 12 bossów (co 10 poziomów, od 10 do 120). Statystyki liczy jeden wzór, więc balans zmienia się w jednym miejscu kodu.

```latex
\text{PŻ} = 40 + 22 \cdot \text{poziom} \qquad \text{Atak} = 8 + 2{,}2 \cdot \text{poziom} \qquad \text{Obrona} = 2 + 0{,}8 \cdot \text{poziom}
```

- **Boss**: PŻ × 2,5, Atak × 1,3, Obrona × 1,3 (po teście balansu); walka do 20 tur; dostępny raz na dobę, gwarantowany łup rzadki lub lepszy.
- **Zdolność**: każdy potwór ma jedną cechę, która zmusza gracza do wyboru taktyki lub klasy.
- **Doświadczenie za potwora** = 25 × poziom (boss × 5); złoto = 3 × poziom ± 20%.

**Ochrona prawna:** nazwy ogólne (goblin, troll, wiwerna) pochodzą z folkloru i są wolne. Imiona bossów i nazwy odmian są wymyślone dla tej gry. Przed premierą sprawdzić każde imię bossa w wyszukiwarce i bazie znaków towarowych EUIPO.

## Szepczący Las (poziomy 1–10)

Gęsty las na skraju królestwa, pełen bandytów i drapieżników. Uczy podstaw walki.

| Poz. | Potwór | PŻ | Atak | Obrona | Zdolność |
| --- | --- | --- | --- | --- | --- |
| 1 | Wściekły szczur | 62 | 10 | 3 | brak (potwór treningowy) |
| 2 | Leśny pająk | 84 | 12 | 4 | jad: 3 obrażenia na turę przez 3 tury |
| 3 | Szary wilk | 110 | 15 | 4 | atakuje w parze: drugi wilk ma 50% PŻ |
| 5 | Goblin zbieracz | 150 | 19 | 6 | ucieka przy 20% PŻ, zabierając 10% złota łupu |
| 7 | Bandyta z traktu | 190 | 23 | 8 | pierwszy cios zawsze krytyczny (zasadzka) |
| 9 | Dzik kłownik | 240 | 28 | 9 | szarża: w 1. turze +50% obrażeń |
| **10 BOSS** | **Szczerbaty Krul, wódz goblinów** | 650 | 39 | 13 | co 3 tury wzywa goblina (60 PŻ); słaby na ogień |

## Bagna Mglistej Wieży (poziomy 11–25)

Zatopione ziemie wokół wieży szalonego nekromanty. Pierwsze spotkanie z nieumarłymi; Kapłan ma tu przewagę.

| Poz. | Potwór | PŻ | Atak | Obrona | Zdolność |
| --- | --- | --- | --- | --- | --- |
| 12 | Topielec | 300 | 34 | 12 | wciąga pod wodę: gracz traci 1 turę (raz na walkę) |
| 14 | Jaszczuroczłek łowca | 350 | 39 | 13 | +20% obrony (łuski), słaby na zaklęcia |
| 16 | Szkielet wojownik | 390 | 43 | 15 | odporny na krytyki; nieumarły |
| 18 | Bagienna wiedźma | 440 | 48 | 16 | klątwa: −15% ataku gracza do końca walki |
| 22 | Ghul | 520 | 56 | 20 | leczy się o 10% zadanych obrażeń; nieumarły |
| 24 | Błędny ognik | 570 | 61 | 21 | 30% uniku; zwykła broń zadaje −25% obrażeń |
| **20 BOSS** | **Morwena, Królowa Bagien** | 1 200 | 68 | 23 | przy 50% PŻ przyzywa 2 topielców; słaba na światło |

## Szczyty Żelaznych Gór (poziomy 26–45)

Mroźne przełęcze i opuszczone kopalnie krasnoludów. Przeciwnicy mają dużo życia, więc liczy się wytrzymałość.

| Poz. | Potwór | PŻ | Atak | Obrona | Zdolność |
| --- | --- | --- | --- | --- | --- |
| 27 | Górski troll | 630 | 67 | 24 | regeneruje 5% PŻ na turę; ogień wyłącza regenerację |
| 32 | Ogr rozbójnik | 740 | 78 | 28 | co 3. cios ogłusza (gracz traci turę) |
| 35 | Gryf | 810 | 85 | 30 | atakuje z powietrza: broń wręcz −20% celności |
| 38 | Kamienny strażnik | 880 | 92 | 32 | +50% obrony, ale −30% inicjatywy |
| 42 | Szronowa harpia | 960 | 100 | 36 | zamraża: −20% ZRĘ gracza na 3 tury |
| 45 | Kret-kruszyciel | 1 030 | 107 | 38 | rozbija pancerz: −10% obrony gracza za każde trafienie |
| **30 BOSS** | **Gorrag Dwugłowy** | 1 750 | 96 | 34 | atakuje 2 razy na turę; każda głowa ma osobny rzut na trafienie |
| **40 BOSS** | **Matka Gryfów Szarych Turni** | 2 300 | 125 | 44 | co 4 tury nurkuje: cios × 2, nie da się go zablokować |

## Ruiny Starego Imperium (poziomy 46–70)

Zgliszcza stolicy dawnych królów, gdzie wciąż działa zaklęta magia. Przeciwnicy wymagają zmiany taktyki.

| Poz. | Potwór | PŻ | Atak | Obrona | Zdolność |
| --- | --- | --- | --- | --- | --- |
| 48 | Runiczny golem | 1 100 | 114 | 40 | odporny na zaklęcia (−40%), słaby na obuchy (+25%) |
| 53 | Upiór maga | 1 210 | 125 | 44 | ignoruje pancerz gracza; nieumarły |
| 58 | Mroczny elf zabójca | 1 320 | 136 | 48 | zawsze zaczyna walkę; 20% szansy na krytyk |
| 63 | Mimik skarbca | 1 430 | 147 | 52 | wygląda jak skrzynia: zaskoczenie, gracz traci 1. turę; +50% złota |
| 65 | Przeklęty legionista | 1 470 | 151 | 54 | wstaje raz z 30% PŻ po pokonaniu; nieumarły |
| 68 | Strażnik-chimera | 1 540 | 158 | 56 | 3 ataki: kły, ogień, jad; losuje jeden na turę |
| **50 BOSS** | **Archiwista Velnor** | 2 850 | 153 | 55 | co 3 tury tarcza magiczna: pochłania 300 obrażeń |
| **60 BOSS** | **Cesarzowa Bez Twarzy** | 3 400 | 182 | 65 | kopiuje taktykę gracza i dostaje jej bonus podwójnie |
| **70 BOSS** | **Kolos Złotej Bramy** | 3 950 | 211 | 75 | tura ładowania co 4 tury, potem cios × 3; Odwrót kończy walkę bez strat |

## Smocze Pustkowia (poziomy 71–100)

Spalona ziemia po Wojnie Smoczej Korony. Smoki wróciły, a z pęknięć w ziemi wychodzą demony.

| Poz. | Potwór | PŻ | Atak | Obrona | Zdolność |
| --- | --- | --- | --- | --- | --- |
| 73 | Wiwerna | 1 650 | 169 | 60 | ogon z jadem: 2% PŻ gracza na turę przez 4 tury |
| 76 | Popielny ogar | 1 710 | 175 | 63 | poluje w stadzie: +10% ataku za każdego innego ogara (2–3 w walce) |
| 83 | Smoczy kultysta | 1 870 | 191 | 68 | wzmacnia sojusznika: +20% ataku bossa, jeśli jest w walce |
| 86 | Magmowy żywiołak | 1 930 | 197 | 71 | odbija 15% obrażeń wręcz; słaby na lód |
| 93 | Rogaty demon | 2 090 | 213 | 76 | wysysa 5% PŻ gracza na turę i dodaje sobie |
| 96 | Młody smok | 2 150 | 219 | 79 | zieje ogniem co 3 tury: obrażenia ignorują obronę |
| **80 BOSS** | **Ignar Popielna Łuska** | 4 500 | 239 | 86 | zieje co 2 tury; poniżej 30% PŻ szał: +30% ataku |
| **90 BOSS** | **Hezrath, Książę Siarki** | 5 050 | 268 | 96 | klątwa: leczenie gracza działa odwrotnie przez 3 tury |
| **100 BOSS** | **Vaelstrax, Ostatni Smoczy Król** | 5 600 | 296 | 107 | 3 fazy (ogień, burza, cień), każda zmienia słabość |

## Otchłań Pękniętej Korony (poziomy 101–120)

Rozpadlina pod dawnym tronem, gdzie zaginęła Smocza Korona. Koniec gry: najtrudniejsze walki i ostatni boss.

| Poz. | Potwór | PŻ | Atak | Obrona | Zdolność |
| --- | --- | --- | --- | --- | --- |
| 101 | Smocze widmo | 2 260 | 230 | 83 | 40% uniku przed bronią; zaklęcia trafiają zawsze |
| 103 | Strażnik Otchłani | 2 310 | 235 | 84 | +30% obrony; każda tura bez obrażeń daje mu kolejne +10% |
| 106 | Archidemon | 2 370 | 241 | 87 | co 3 tury zdejmuje z gracza jedną premię zestawu |
| 113 | Koronny upiór | 2 530 | 257 | 92 | ukradziony tytuł: kopiuje bonus bóstwa gracza |
| 116 | Pustkowiec | 2 590 | 263 | 95 | pochłania 20% obrażeń magicznych i oddaje je w następnej turze |
| 118 | Pomiot Otchłani | 2 640 | 268 | 96 | rozdziela się przy 50% PŻ na 2 słabsze stwory |
| **110 BOSS** | **Sędzia Pękniętego Tronu** | 6 150 | 325 | 117 | co 5 tur wyrok: gracz z PŻ poniżej 25% przegrywa od razu |
| **120 BOSS** | **Pierwotny Smok** | 6 700 | 354 | 127 | 4 fazy, w każdej inna słabość i ochrona; po zwycięstwie raz na serwer tytuł „Pogromca Pierwotnego” |

## Zręczność, typy i żywioły potworów

**Zręczność potwora** = 10 + poziom, tak samo dla bossów (tę wartość przyjął test balansu). Wynika z niej trafienie, unik i inicjatywa potwora według wzorów z zakładki Systemy walki.

**Typ** decyduje o zdolnościach przeciw niemu (np. Kapłan i Paladyn przeciw nieumarłym i demonom). Słabość: +25% obrażeń tego żywiołu, odporność: −40%; puste pole oznacza brak.

| Potwór | Poz. | Typ | Słaby na | Odporny na |
| --- | --- | --- | --- | --- |
| Wściekły szczur | 1 | zwierzę | Ogień | — |
| Leśny pająk | 2 | zwierzę | Ogień | Trucizna |
| Szary wilk | 3 | zwierzę | Ogień | — |
| Goblin zbieracz | 5 | humanoid | Ogień | — |
| Bandyta z traktu | 7 | humanoid | — | — |
| Dzik kłownik | 9 | zwierzę | Trucizna | — |
| Szczerbaty Krul (boss) | 10 | humanoid | Ogień | — |
| Topielec | 12 | nieumarły | Błyskawica, Światło | Lód, Trucizna |
| Jaszczuroczłek łowca | 14 | humanoid | Błyskawica, Lód | Trucizna |
| Szkielet wojownik | 16 | nieumarły | Światło, Fizyczne (obuchy) | Trucizna, Cień |
| Bagienna wiedźma | 18 | humanoid | Światło | Trucizna, Cień |
| Morwena (boss) | 20 | nieumarły | Światło, Ogień | Lód, Trucizna |
| Ghul | 22 | nieumarły | Światło, Ogień | Trucizna |
| Błędny ognik | 24 | żywiołak | Lód | Fizyczne |
| Górski troll | 27 | olbrzym | Ogień | — |
| Gorrag Dwugłowy (boss) | 30 | olbrzym | Ogień | Trucizna |
| Ogr rozbójnik | 32 | olbrzym | Błyskawica | — |
| Gryf | 35 | bestia | Błyskawica | — |
| Kamienny strażnik | 38 | konstrukt | Błyskawica, Fizyczne (obuchy) | Trucizna, Ogień |
| Matka Gryfów (boss) | 40 | bestia | Błyskawica | Lód |
| Szronowa harpia | 42 | bestia | Ogień | Lód |
| Kret-kruszyciel | 45 | bestia | Lód | Fizyczne |
| Runiczny golem | 48 | konstrukt | Błyskawica, Fizyczne (obuchy) | Ogień, Lód, Trucizna |
| Archiwista Velnor (boss) | 50 | nieumarły | Światło | Cień, Trucizna |
| Upiór maga | 53 | nieumarły | Światło | Cień, Trucizna, Fizyczne |
| Mroczny elf zabójca | 58 | humanoid | Światło | Cień |
| Cesarzowa Bez Twarzy (boss) | 60 | nieumarły | Światło | Cień, Trucizna |
| Mimik skarbca | 63 | bestia | Ogień | — |
| Przeklęty legionista | 65 | nieumarły | Światło | Trucizna |
| Strażnik-chimera | 68 | bestia | Lód | Ogień, Trucizna |
| Kolos Złotej Bramy (boss) | 70 | konstrukt | Błyskawica | Trucizna, Ogień, Lód |
| Wiwerna | 73 | smok | Lód | Trucizna |
| Popielny ogar | 76 | demon | Lód, Światło | Ogień |
| Ignar Popielna Łuska (boss) | 80 | smok | Lód | Ogień |
| Smoczy kultysta | 83 | humanoid | Lód | Ogień |
| Magmowy żywiołak | 86 | żywiołak | Lód | Ogień, Trucizna |
| Hezrath (boss) | 90 | demon | Światło | Ogień, Cień |
| Rogaty demon | 93 | demon | Światło, Lód | Ogień |
| Młody smok | 96 | smok | Lód | Ogień |
| Vaelstrax (boss) | 100 | smok | faza ognia: Lód; faza burzy: Fizyczne; faza cienia: Światło | żywioł bieżącej fazy (Ogień, Błyskawica, Cień) |
| Smocze widmo | 101 | nieumarły | Światło | Fizyczne, Ogień |
| Strażnik Otchłani | 103 | konstrukt | Błyskawica | Cień |
| Archidemon | 106 | demon | Światło | Ogień, Cień |
| Sędzia Pękniętego Tronu (boss) | 110 | nieumarły | Światło | Cień, Trucizna |
| Koronny upiór | 113 | nieumarły | Światło | Cień |
| Pustkowiec | 116 | żywiołak | Fizyczne | Ogień, Lód, Błyskawica |
| Pomiot Otchłani | 118 | demon | Światło, Ogień | Trucizna |
| Pierwotny Smok (boss) | 120 | smok | inna w każdej z 4 faz | inna w każdej z 4 faz |
