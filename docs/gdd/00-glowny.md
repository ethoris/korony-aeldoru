# Gra fantasy – GDD

Oct 24, 2026 · @Patryk

## Wizja

Tekstowa gra MMORPG w przeglądarce, osadzona w klasycznym świecie fantasy z elfami, krasnoludami, orkami i smokami, w duchu starych polskich gier przeglądarkowych, ale z nowoczesnym wyglądem i lepszym balansem. Robocza nazwa: **Korony Aeldoru** (przed publikacją sprawdzić, czy nazwa i domena są wolne).

Gracz tworzy bohatera, wybiera rasę, klasę i bóstwo, rusza na wyprawy, buduje twierdzę, a z czasem walczy z gildią o władzę nad prowincjami i koronę królestwa.

**Filary rozgrywki:**

- **Myślenie zamiast klikania**: walkę rozstrzyga rozwój postaci i taktyka, wynik czytasz w barwnym raporcie tekstowym.
- **Czas jako zasób**: wyprawy i budowy trwają realne minuty, więc gra pasuje do kilku krótkich wejść dziennie.
- **Ludzie**: gildie, handel i polityka są ważniejsze niż samotne grindowanie.
- **Uczciwość**: brak pay-to-win, płatności tylko za wygodę i wygląd.

**Gracz docelowy:** dorosły, lubi strategię i czytanie, gra z telefonu lub komputera w przerwach w ciągu dnia. Interfejs po polsku, angielski później.

## Świat

Akcja toczy się na kontynencie **Aeldor**, sto lat po Wojnie Smoczej Korony. Ostatni król zginął bez następcy, jego korona zaginęła, a królestwo rozpadło się na prowincje rządzone przez lordów, gildie i najemników. Z ruin starego imperium wyłażą potwory, a w górach znów widziano smoki.

Gracze to poszukiwacze przygód, którzy walczą o złoto, sławę i w końcu o koronę.

**Serwery:** każdy serwer to osobne królestwo Aeldoru z własną mapą prowincji i rankingiem (np. *Valmor* jako pierwszy). Nowe serwery otwieramy co kilka miesięcy, żeby nowi gracze startowali równo.

**Bóstwa** (wybór przy tworzeniu postaci, mały stały bonus i własne zadania):

| Bóstwo | Domena | Bonus |
| --- | --- | --- |
| Solaris | światło, uzdrawianie | +10% skuteczności leczenia i zaklęć ochronnych |
| Korgath | wojna, stal | +5% obrażeń w walce wręcz |
| Ilyra | magia, gwiazdy | +10% doświadczenia z wypraw |
| Veyl | cienie, podstęp | +5% szansy na trafienie krytyczne |
| Mardun | handel, złoto | +10% złota z wypraw i handlu |
| Thessa | natura, łowy | +5% celności broni dystansowej |
| Morrak | śmierć, przeznaczenie | 25% mniejsze straty po przegranej walce |

**Ton:** klasyczna przygoda z nutą powagi; raporty barwne, czasem z humorem. Wszystkie nazwy i teksty są oryginalne.

## Rasy

Sześć ras; modyfikatory statystyk sumują się do 0, więc żadna nie jest po prostu lepsza, a każda ma jedną cechę specjalną.

| Rasa | SIŁ | ZRĘ | WYT | INT | Cecha specjalna |
| --- | --- | --- | --- | --- | --- |
| Człowiek | 0 | 0 | 0 | 0 | +1 dodatkowy punkt statystyk co 5 poziomów |
| Elf | −2 | +2 | −2 | +2 | +10% skuteczności zaklęć |
| Krasnolud | +1 | −2 | +3 | −2 | −15% kosztu i czasu budowy w twierdzy |
| Ork | +3 | 0 | +1 | −4 | +10% obrażeń, gdy ma mniej niż 50% PŻ |
| Niziołek | −3 | +3 | 0 | 0 | 10% szansy na uniknięcie ciosu niezależnie od celności |
| Smokokrwisty | +2 | −1 | +1 | −2 | raz na walkę zieje ogniem (obrażenia = 2× poziom) |

Skróty: SIŁ – siła, ZRĘ – zręczność, WYT – wytrzymałość, INT – intelekt. Rasę można zmienić raz, za rzadki przedmiot zdobyty w grze.

## Klasy i statystyki

Cztery statystyki główne zaczynają od 10 (plus modyfikator rasy). Za każdy poziom gracz dostaje 3 punkty do rozdania. Maksymalny poziom postaci: 120 na start, 200 po aktualizacji X.

| Klasa | Główna statystyka | Styl walki | Mocna strona | Słabość |
| --- | --- | --- | --- | --- |
| Wojownik | SIŁ | broń dwuręczna | najwyższe obrażenia | niska obrona |
| Paladyn | WYT | miecz i tarcza | blok 15% ciosów, leczy się raz na walkę | wolne zabijanie |
| Łucznik | ZRĘ | łuk | 1 darmowy strzał przed walką wręcz | słabszy w zwarciu |
| Łotr | ZRĘ | dwa sztylety | 2 ataki na turę, krytyki | mało punktów życia |
| Mag | INT | zaklęcia | obrażenia ignorują pancerz | najsłabszy pancerz |
| Kapłan | INT | buława i modlitwy | leczenie co 3 tury, mocny przeciw nieumarłym | niskie obrażenia |

Łucznik ma tylko jeden darmowy strzał, a nie przewagę przez całą walkę, żeby nie wygrywał wszystkiego w pierwszej rundzie.

**Statystyki wyliczane:**

```latex
\text{PŻ} = 50 + 12 \cdot \text{WYT} + 8 \cdot \text{poziom}
```

```latex
\text{Atak} = \text{obrażenia broni} \cdot \left(1 + \frac{2S}{S + 100}\right)
```

- **Obrona** = pancerz z ekwipunku + WYT ÷ 2
- **Inicjatywa** (kto zaczyna) = ZRĘ + losowo 1–10
- **Szansa na trafienie** = 80% + 1% × różnica poziomów + 10% × przewaga zręczności, w granicach 50–95% (szczegóły w zakładce Systemy walki)
- **Szansa na krytyk** = 5% + 10% × min(1, (ZRĘ − 10) ÷ (2 × poziom)), maks. 15%; krytyk zadaje 1,5× obrażeń

**Doświadczenie na kolejny poziom:**

```latex
\text{PD} = 34 \cdot \text{poziom}^{1{,}7}
```

Przykład: z poziomu 1 na 2 trzeba 34 PD, z 10 na 11 około 1 700 PD, z 50 na 51 około 26 300 PD, z 119 na 120 około 114 800 PD. Potwór daje 25 × swój poziom PD; tempo zdobywania poziomów opisuje zakładka Balans.

## Walka i raporty

Walka liczy się automatycznie na serwerze, maksymalnie przez 15 tur (z bossem 20), a gracz dostaje raport tekstowy. Gracz nie klika w trakcie; decyduje wcześniej ekwipunkiem, rozwojem i **taktyką**.

**Taktyki** (ustawiane przed wyprawą lub atakiem):

- **Natarcie**: +15% ataku, −15% obrony
- **Równowaga**: bez zmian
- **Defensywa**: +15% obrony, −15% ataku
- **Odwrót przy 30% PŻ**: remis, gdy życie spadnie poniżej 30%; bez łupów, ale z mniejszymi stratami

**Przebieg walki:**

1. Obie strony losują inicjatywę, wyższa zaczyna (Łucznik najpierw oddaje darmowy strzał).
2. Atakujący rzuca na trafienie, potem na krytyk.
3. Obrażenia = Atak × losowo 0,85–1,15 × (1 − redukcja przez obronę), minimum 1; wzór redukcji w zakładce Systemy walki.
4. Strony wymieniają ciosy, aż ktoś spadnie do 0 PŻ albo minie limit tur (15, z bossem 20).
5. Po limicie tur wygrywa ten, kto ma większy procent pozostałego życia.

Losowość korzysta z zapisanego ziarna (seed), więc każdy raport da się odtworzyć przy zgłoszeniach oszustw.

**Raport:** każda akcja losuje jeden z kilku opisów pasujących do broni i wyniku, żeby raporty się nie powtarzały. Przykład:

> Tura 1. Aldric z Valmoru unosi topór i rusza na goblina. Ostrze trafia w ramię – 28 obrażeń. Tura 2. Goblin skrzeczy i dźga zardzewiałą włócznią. Aldric odbija ją tarczą. Pudło. Tura 3. Potężny zamach rozcina skórzany pancerz! Trafienie krytyczne – 52 obrażenia. Goblin pada. Zwycięstwo. Zdobywasz 125 PD, 15 złota i Pierścień Leśnego Szeptu.

## Wyprawy, krainy i przedmioty

Wyprawa to główne źródło doświadczenia i łupów: gracz wybiera miejsce, wysyła bohatera, a po upływie czasu dostaje raport. W tym czasie bohater jest zajęty.

**Czas i energia:** wyprawy trwają od 5 minut (pierwsze poziomy) do 30 minut (poziom 120), a po aktualizacji X do 45 minut (poziom 200). Gracz ma 100 punktów **wytrwałości**, wyprawa kosztuje 10–20 (do 25 w krainach 7–10), a wytrwałość odnawia się o 1 co 3 minuty.

**Krainy** (odblokowywane poziomem; krainy 7–10 dla poziomów 121–200 i wszystkie 72 lokacje wypraw są w zakładce Lokacje):

| Poziom | Kraina | Przykładowi przeciwnicy |
| --- | --- | --- |
| 1–10 | Szepczący Las | wilki, gobliny, bandyci |
| 11–25 | Bagna Mglistej Wieży | nieumarli, jaszczuroludzie, wiedźmy |
| 26–45 | Szczyty Żelaznych Gór | trolle, ogry, gryfy |
| 46–70 | Ruiny Starego Imperium | golemy, upiory magów, mroczne elfy |
| 71–100 | Smocze Pustkowia | wiwerny, demony, smoki |
| 101–120 | Otchłań Pękniętej Korony | smocze widma, archidemony, Pierwotny Smok (boss końcowy) |

Co 10 poziomów w każdej krainie czeka **boss** (np. Królowa Bagien), dostępny raz dziennie, z gwarantowanym rzadkim łupem.

**Przedmioty:** 8 miejsc na ekwipunek (broń, tarcza lub druga broń, hełm, zbroja, rękawice, buty, amulet, pierścień).

| Rzadkość | Szansa przy łupie | Dodatkowe cechy |
| --- | --- | --- |
| Zwykły | 70% | 0 |
| Magiczny | 22% | 1 |
| Rzadki | 6,5% | 2 |
| Legendarny | 1,5% | 3 + unikalna zdolność |

Na start gry ekwipunek sięga poziomu 100; na poziomach 101–120 gracze rozwijają się dalej, a przedmioty powyżej 100 dojdą w aktualizacjach. Przedmioty mają wymagany poziom i można je **ulepszać** u kowala w twierdzy do +10 (po aktualizacji X do +20); każdy poziom ulepszenia daje +2% obrażeń broni lub pancerza, a od +4 jest szansa niepowodzenia. Przedmiot nigdy nie przepada. Szczegóły w zakładce Ekwipunek.

## Twierdza

Od 5 poziomu gracz zakłada twierdzę, która produkuje surowce cały czas, także gdy go nie ma. Daje stałe bonusy bohaterowi i jest bazą do gry o prowincje.

**Surowce:** drewno, kamień, żelazo, żywność, złoto (złoto także z wypraw i handlu) oraz rzadka **mana** do ulepszeń magicznych.

**Budynki** (każdy do poziomu 20; koszt rośnie o 30%, a czas o 25% na poziom; liczby w zakładce Twierdza i wojna):

| Budynek | Co daje |
| --- | --- |
| Ratusz | główny budynek; jego poziom ogranicza poziom pozostałych |
| Tartak, Kamieniołom, Kopalnia, Farma | produkcja surowców |
| Wieża Magów | produkcja many, nowe zaklęcia dla magów |
| Magazyn | pojemność surowców i ochrona części przed grabieżą |
| Kuźnia | wykuwanie i ulepszanie przedmiotów |
| Świątynia | bonus od bóstwa rośnie, zadania od kapłanów |
| Koszary | szkolenie wojska: włócznicy, łucznicy, rycerze, magowie bitewni, tarany |
| Mury | obrona twierdzy przed napadami |
| Targowisko | handel z innymi graczami |

W jednym momencie trwa jedna budowa (dwie z kontem Premium). Napaść na twierdzę innego gracza może zrabować do 20% surowców ponad ochronę magazynu, a nowi gracze mają **7 dni ochrony** przed atakami.

## PvP, prowincje, gildie i handel

Od 15 poziomu gracze mogą walczyć ze sobą, a od 20 przejmować prowincje. To serce długiej gry: władza, gildie i polityka.

**Pojedynki (PvP):** atak na gracza w przedziale ±5 poziomów, raport jak przy wyprawie. Tego samego przeciwnika można zaatakować maks. 3 razy na dobę. Zwycięzca dostaje PD, 3% złota przegranego i punkty **sławy** do rankingu (wzór i rangi w zakładce Systemy walki; miesięczne sezony; zwycięzca sezonu dostaje +10% do głównej statystyki i tytuł do startu następnego sezonu). Za walkę z dawno nieaktywnymi graczami nagroda spada do zera, żeby nie dało się na nich farmić doświadczenia.

**Prowincje:** mapa serwera dzieli się na około 50 prowincji. Prowincja daje właścicielowi podatek w surowcach i bonus (np. +10% żelaza). Żeby ją przejąć, trzeba wygrać oblężenie z jej obrońcami. Jedna prowincja na gracza, więcej tylko dla gildii.

**Lordowie i korona:** gildia, która trzyma najwięcej prowincji w regionie, mianuje **lorda** regionu. Raz w miesiącu lordowie stają do turnieju o **Smoczą Koronę**; zwycięzca zostaje królem serwera i ustala jeden ogólny bonus dla całego świata na miesiąc.

**Gildie:** do 20 graczy, wspólny skarbiec, czat, wspólne oblężenia i pomoc w obronie twierdz.

**Handel:** targowisko, na którym gracze wystawiają surowce i przedmioty za złoto, z podatkiem 5% (hamuje inflację). Bezpośrednia wymiana między graczami dopiero od 10 poziomu, żeby utrudnić przelewanie dóbr z kont-klonów.

## Zarabianie

Gra jest darmowa, a płatności dają wygodę i wygląd, nigdy siłę w walce. Na start wystarczy konto Premium; reszta, gdy będą gracze.

**Konto Premium**: 19,99 zł / 3,99 EUR / 4,99 USD miesięcznie (ceny brutto, z VAT):

- dwie budowy naraz zamiast jednej
- kolejka do 3 wypraw z rzędu
- dłuższa historia raportów i statystyki walk
- +20 miejsc w plecaku (30 → 50)
- ozdobna ramka i kolor nicku w rankingu

**Czego nie sprzedajemy:** punktów statystyk, przedmiotów do walki, doświadczenia ani skracania wypraw za pieniądze.

**Później:** portrety bohaterów, herby gildii, dobrowolne wsparcie twórcy. Płatności przez polskiego operatora (np. Przelewy24 lub Stripe z BLIK). Przy sprzedaży potrzebny regulamin, polityka prywatności i uregulowane podatki (działalność gospodarcza lub nierejestrowana do limitu).

## Wersja 1 i technologia

Wersja 1 to grywalny rdzeń z rankingiem: bohater, wyprawy, walka, przedmioty. Twierdza, PvP i prowincje przychodzą w kolejnych wersjach, gdy rdzeń będzie dobrze zbalansowany.

**Zakres wersji 1:**

- [ ] Rejestracja i logowanie (e-mail + hasło)
- [ ] Tworzenie bohatera: imię, rasa, klasa, bóstwo
- [ ] Ekran bohatera: statystyki, rozdawanie punktów, poziom
- [ ] Wyprawy w 2 krainach (poziomy 1–25, 11 lokacji) z czasem i wytrwałością, bossowie Szczerbaty Krul i Morwena
- [ ] Silnik walki i raporty tekstowe
- [ ] Łupy i ekwipunek (bez ulepszania); zadania fabularne i zlecenia rozdziałów I–II, które odblokowują lokacje
- [ ] Ranking graczy
- [ ] Regulamin i polityka prywatności

**Technologia:**

| Element | Wybór | Dlaczego |
| --- | --- | --- |
| Aplikacja | Next.js + TypeScript | jeden projekt na stronę i serwer, dużo przykładów |
| Baza danych | PostgreSQL + Prisma | solidna baza, czytelny opis tabel |
| Logowanie | Auth.js | gotowe, bezpieczne logowanie |
| Wygląd | Tailwind CSS | szybkie, spójne style, działa na telefonie |
| Hosting | Vercel + Neon | testy: Vercel Hobby i Neon Free (0 zł); od startu z Premium: Vercel Pro (20 USD/mies.), bo Hobby jest tylko do użytku niekomercyjnego, i Neon Launch (płatność za zużycie, odtwarzanie do 7 dni wstecz) |
| Kod | GitHub | kopia zapasowa i historia zmian |

**Zasada czasu:** wyprawy i budowy zapisują godzinę zakończenia, a wynik liczy się przy następnym wejściu gracza, bez procesów w tle.

**Zasada uczciwości:** wszystkie obliczenia (walka, łupy, czas) dzieją się na serwerze, przeglądarka tylko wyświetla wynik.

**Jak pracujemy:** instalujesz VS Code, Node.js, Git i rozszerzenie Claude Code; ja piszę kod etapami, a Ty uruchamiasz i sprawdzasz w przeglądarce.
