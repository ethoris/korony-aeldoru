# Systemy walki

## Wzory walki

Te wzory zastępują wzory z głównej zakładki. Pierwsza wersja dawała ogromną przewagę klasom zręcznościowym (Łucznik i Łotr wygrywali z bossem w 100%, Wojownik w 0%), czyli ten sam błąd co w starych grach. Wyniki testu są w zakładce Balans.

**Punkty życia:**

```latex
\text{PŻ} = 50 + 12 \cdot \text{WYT} + 8 \cdot \text{poziom}
```

**Atak** (statystyka główna S daje coraz mniejszy przyrost, więc postać nie rośnie w nieskończoność):

```latex
\text{Atak} = \text{obrażenia broni} \cdot \left(1 + \frac{2S}{S + 100}\right)
```

**Redukcja obrażeń przez obronę** (zamiast odejmowania, które psuło się przy wysokich poziomach):

```latex
\text{redukcja} = \frac{\text{Obrona}}{\text{Obrona} + 10 \cdot \text{poziom atakującego} + 50}
```

- **Obrona** = pancerz z ekwipunku + WYT ÷ 2
- **Obrażenia** = Atak × losowo 0,85–1,15 × (1 − redukcja), minimum 1
- **Przewaga zręczności** = (ZRĘ atakującego − ZRĘ obrońcy) ÷ (suma ich poziomów + 20), w granicach od −1 do 1
- **Trafienie** = 80% + 1% × różnica poziomów + 10% × przewaga zręczności, w granicach 50–95%
- **Krytyk** = 5% + 10% × min(1, (ZRĘ − 10) ÷ (2 × poziom)), więc maks. 15%; krytyk × 1,5
- **Inicjatywa** = ZRĘ + losowo 1–10
- **Limit tur**: 15 ze zwykłym potworem, 20 z bossem

**Cechy klas po teście:**

| Klasa | Mnożnik broni | Mnożnik pancerza | Cecha |
| --- | --- | --- | --- |
| Wojownik | 1,45 (dwuręczna) | 1,0 | — |
| Paladyn | 0,65 (miecz) | 0,6 | tarcza blokuje 15% ciosów; raz na walkę leczy 20% PŻ przy spadku poniżej 40% |
| Łucznik | 0,95 (łuk) | 0,8 | 1 darmowy strzał przed walką |
| Łotr | 0,55 (sztylet, 2 ataki) | 0,8 | 2 ataki na turę |
| Mag | 1,35 (kostur) | 0,6 | obrażenia ignorują obronę |
| Kapłan | 0,75 (buława) | 0,9 | co 3 tury leczy 15% PŻ |

**Bossowie:** PŻ × 2,5, Atak × 1,3, Obrona × 1,3 (poprzednio × 4 i × 1,5 – walka nie mieściła się w limicie tur).

## Żywioły

Każde obrażenie ma jeden z 7 typów. Słabość to +25% obrażeń tego typu, odporność to −40%; potwór bez opisu jest neutralny.

| Typ | Kto zadaje | Kto jest słaby |
| --- | --- | --- |
| Fizyczne | każda broń bez runy | golemy (tylko obuchy: buława, młot) |
| Ogień | zaklęcia Maga, zionięcie Smokokrwistego, runa ognia | trolle, gobliny, lodowe stwory, nieumarli |
| Lód | zaklęcia Maga, runa lodu | żywiołaki magmy, demony ognia, smoki ognia |
| Błyskawica | zaklęcia Maga, runa burzy | jaszczuroludzie, golemy, stwory wodne |
| Światło | modlitwy Kapłana, umiejętności Paladyna, runa światła | nieumarli, demony, cienie |
| Cień | umiejętności Łotra, runa cienia | istoty światła, kapłani wroga |
| Trucizna | umiejętności Łotra i Łucznika, runa jadu | zwierzęta, ludzie; nieumarli i golemy są odporni |

**Runy żywiołów** (Kuźnia poziomu 8): runa w broni zamienia 30% obrażeń broni na wybrany żywioł. Jedna runa na broń; wymiana niszczy starą. Dzięki temu każda klasa może przygotować się na konkretnego bossa.

**Odporność gracza:** amulety i pierścienie mogą dawać odporność na żywioł (maks. 40% z ekwipunku), co ma znaczenie przy smokach i demonach.

## Zdolności klas

Każda klasa ma 6 zdolności odblokowywanych na poziomach 1, 10, 25, 45, 70 i 100. Przed wyprawą gracz wybiera **3 aktywne** (to druga, obok taktyki, ważna decyzja przed walką). Zdolność odpala się sama, gdy minie odnowienie albo spełni się warunek. Zdolność z poziomu 1 jest zawsze aktywna i nie zajmuje miejsca.

### Wojownik

| Poz. | Zdolność | Efekt | Odnowienie |
| --- | --- | --- | --- |
| 1 | Potężny zamach | cios × 1,6 | 4 tury |
| 10 | Okrzyk bojowy | +15% ataku na 3 tury | raz na walkę, tura 1 |
| 25 | Rozpłatanie | cios ignoruje 50% obrony; jeśli zabije, darmowy kolejny atak | 5 tur |
| 45 | Krwawa rana | krwawienie: 4% PŻ wroga na turę przez 4 tury | 6 tur |
| 70 | Nieustępliwość | poniżej 25% PŻ: −30% otrzymywanych obrażeń przez 3 tury | raz na walkę |
| 100 | Furia Tytana | 3 ciosy po 80% obrażeń | 7 tur |

### Paladyn

| Poz. | Zdolność | Efekt | Odnowienie |
| --- | --- | --- | --- |
| 1 | Uderzenie tarczą | cios × 1,2, 30% szansy na ogłuszenie (wróg traci turę) | 4 tury |
| 10 | Święta broń | ciosy zadają +20% obrażeń jako Światło przez 4 tury | 6 tur |
| 25 | Ochrona wiary | blok tarczy 30% przez 3 tury | 6 tur |
| 45 | Wyrok | wróg poniżej 30% PŻ: cios × 2 | 5 tur |
| 70 | Aura odwagi | −15% obrażeń od nieumarłych i demonów przez całą walkę | pasywna |
| 100 | Boska tarcza | następne 2 ciosy wroga zadają 0 | raz na walkę |

### Łucznik

| Poz. | Zdolność | Efekt | Odnowienie |
| --- | --- | --- | --- |
| 1 | Celny strzał | strzał × 1,5, zawsze trafia | 4 tury |
| 10 | Zatruta strzała | Trucizna: 3% PŻ wroga na turę przez 4 tury | 5 tur |
| 25 | Odskok | po otrzymaniu ciosu 25% szansy na unik następnego | pasywna |
| 45 | Grad strzał | 3 strzały po 50% obrażeń | 5 tur |
| 70 | Strzał w słaby punkt | następny cios ma 100% szansy na krytyk | 6 tur |
| 100 | Strzała Pradrzewa | strzał × 3, ignoruje obronę | raz na walkę |

### Łotr

| Poz. | Zdolność | Efekt | Odnowienie |
| --- | --- | --- | --- |
| 1 | Cios w plecy | jeśli Łotr zaczyna walkę, pierwszy cios × 2 | raz na walkę |
| 10 | Jad na ostrzach | ciosy zatruwają: 2% PŻ na turę (do 3 nałożeń) | pasywna |
| 25 | Zasłona dymna | +30% uniku przez 2 tury | 5 tur |
| 45 | Taniec ostrzy | 4 ciosy po 50% obrażeń | 5 tur |
| 70 | Cienisty krok | po uniku następny cios jako Cień, × 1,5 | pasywna |
| 100 | Egzekucja | wróg poniżej 15% PŻ ginie natychmiast (bossowie: cios × 3) | raz na walkę |

### Mag

Mag wybiera żywioł zaklęć przed wyprawą: Ogień, Lód albo Błyskawicę. Podstawowy atak Maga zadaje obrażenia tego żywiołu.

| Poz. | Zdolność | Efekt | Odnowienie |
| --- | --- | --- | --- |
| 1 | Pocisk mocy | zaklęcie × 1,5 | 4 tury |
| 10 | Magiczna tarcza | pochłania obrażenia równe 20% PŻ Maga | 6 tur |
| 25 | Spowolnienie | wróg traci co drugą turę przez 4 tury | 7 tur |
| 45 | Kula ognia / Lodowa włócznia / Łańcuch błyskawic | zaklęcie × 2 swojego żywiołu; lód dodatkowo −20% inicjatywy wroga | 5 tur |
| 70 | Przeciążenie many | +30% obrażeń zaklęć przez 3 tury, potem 1 tura przerwy | 8 tur |
| 100 | Gniazdo meteorów | zaklęcie × 3, ignoruje odporności | raz na walkę |

### Kapłan

| Poz. | Zdolność | Efekt | Odnowienie |
| --- | --- | --- | --- |
| 1 | Święty płomień | cios Światłem × 1,4 | 4 tury |
| 10 | Odnowa | leczy 6% PŻ na turę przez 3 tury | 6 tur |
| 25 | Oczyszczenie | zdejmuje truciznę, klątwę lub krwawienie | 4 tury, gdy trzeba |
| 45 | Kara niebios | nieumarli i demony: cios × 2,5 | 5 tur |
| 70 | Modlitwa ochronna | −25% otrzymywanych obrażeń przez 3 tury | 7 tur |
| 100 | Wskrzeszenie | po spadku do 0 PŻ wraca z 30% PŻ | raz na walkę |

Zdolności nie były jeszcze uwzględnione w teście balansu. Ich siła jest podobna dla wszystkich klas (średnio +15–20% skuteczności), więc proporcje między klasami powinny zostać; sprawdzimy to w drugiej symulacji po zakodowaniu silnika walki.

## Porażka i rany

Porażka boli, ale nigdy nie niszczy postaci: nie traci się poziomu, przedmiotów ani złota w skarbcu twierdzy.

| Sytuacja | Skutek |
| --- | --- |
| Przegrana wyprawa (PvE) | brak łupu, 30% PD, stan **ranny** na 15 min; utrata 5% złota noszonego przy sobie |
| Przegrana z bossem | brak łupu, 50% PD (za odwagę), ranny 30 min; próba bossa zużyta na dziś |
| Remis po limicie tur lub Odwrót | brak łupu, 50% PD, bez rany |
| Przegrany pojedynek PvP | utrata sławy według wzoru poniżej, 3% złota przy sobie, bez rany |
| Przegrana obrona twierdzy | rabunek surowców (zakładka Twierdza i wojna), bohater bez rany |

**Ranny** bohater nie może ruszyć na wyprawę ani atakować. Ranę leczy czas, mikstura uzdrowienia albo Świątynia twierdzy (od poziomu 5 leczy natychmiast za złoto).

**Bóstwo Morrak:** rana trwa o 25% krócej, a utrata złota przy sobie jest o 25% mniejsza.

**Złoto przy sobie a skarbiec:** złoto z wypraw trafia najpierw do sakwy bohatera. Gracz przenosi je do skarbca twierdzy (lub do banku w mieście przed założeniem twierdzy), gdzie jest bezpieczne.

## Sława i rangi PvP

Sława mierzy wyniki w pojedynkach i sama w sobie **nie zmienia statystyk bohatera**. Jedyny wyjątek to zwycięzca sezonu (niżej). Pozostałe nagrody to rangi, tytuły, wygląd i drobne przedmioty użytkowe.

**Wzór (system Elo):** każdy zaczyna z 1 000 sławy. Po pojedynku:

```latex
E = \frac{1}{1 + 10^{(S_{\text{przeciwnika}} - S_{\text{gracza}}) / 400}} \qquad \Delta S = 32 \cdot (\text{wynik} - E)
```

Wynik = 1 za wygraną, 0 za przegraną. Pokonanie silniejszego daje dużo (do +32), słabszego mało; przegrana z silniejszym kosztuje niewiele. Za walkę z graczem nieaktywnym ponad 7 dni sława się nie zmienia.

| Ranga | Sława | Nagroda na koniec sezonu |
| --- | --- | --- |
| Brąz | poniżej 1 200 | 5 odznak chwały |
| Srebro | 1 200–1 399 | 15 odznak, srebrna ramka |
| Złoto | 1 400–1 599 | 30 odznak, złota ramka |
| Mistrz | 1 600–1 799 | 50 odznak, tytuł „Mistrz Areny” |
| Legenda | 1 800 i więcej | 80 odznak, tytuł „Legenda Areny” i herb w stolicy do startu następnego sezonu |

**Sezon** trwa 1 miesiąc kalendarzowy i kończy się ostatniego dnia miesiąca o 22:00; potem sława wraca w połowie do 1 000 (np. 1 600 → 1 300).

**Zwycięzca sezonu** (1. miejsce w rankingu sławy na serwerze) dostaje na cały następny sezon:

- tytuł **„Czempion Areny”**, ważny tylko do startu następnego sezonu, potem przechodzi na nowego zwycięzcę
- **+10% do głównej statystyki swojej klasy** (np. SIŁ Wojownika, WYT Paladyna) do startu następnego sezonu

Przez wzory walki bonus daje w praktyce ok. +2% obrażeń na poziomie 100 (u Paladyna, którego główną statystyką jest WYT, także ok. +7% PŻ). To wyróżnienie, nie przewaga, której nie da się dogonić. Remis w sławie rozstrzyga większa liczba wygranych w sezonie.

**Odznaki chwały** wymienia się u Kwatermistrza Areny w Valmorze na wygląd, mikstury i maks. 3 odłamki gwiazd na sezon. Poza bonusem zwycięzcy sezonu to jedyna nagroda z PvP, która pomaga w rozwoju, i ma twardy limit.

## Sezon I: nagrody na start PvP

Pierwszy sezon ma nagrody, których nie da się zdobyć później. Na start gry trwałe nagrody są kosmetyczne; od aktualizacji z tytułami część z nich daje małe bonusy (zakładka Tytuły). Bonus Czempiona zostaje tymczasowy jak w każdym sezonie.

| Kto | Nagroda |
| --- | --- |
| Każdy z min. 10 walkami w sezonie | tytuł „Pionier Areny” na stałe; ramka profilu z datą sezonu I |
| Top 100 | +20 odznak chwały; herb sezonu I przy nicku na stałe |
| Top 10 | imię na stałe w Sali Chwały w Valmorze; wygląd broni „Ostrze Pierwszej Krwi” (bez statystyk) |
| Top 1 | „Czempion Areny” i +10% do głównej statystyki do startu sezonu II; na stałe tytuł „Pierwszy Czempion Aeldoru” i posąg w Valmorze |
