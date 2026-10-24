# Technika

## Ekrany gry

Gra ma 18 ekranów; wersja 1 potrzebuje 10 z nich. Wygląd ekranów opisuje zakładka Wygląd. Wszystkie są projektowane najpierw pod telefon, z dolnym menu: Bohater, Wyprawy, Twierdza, Miasto, Więcej.

| Ekran | Co pokazuje i co można zrobić | Wersja |
| --- | --- | --- |
| Strona startowa | opis gry, rejestracja, logowanie | 1 |
| Tworzenie bohatera | rasa, klasa, bóstwo, imię, podgląd statystyk | 1 |
| Bohater | statystyki, rozdawanie punktów, poziom, PD, rana | 1 |
| Ekwipunek | 8 slotów, plecak, porównanie przedmiotów | 1 |
| Wyprawy | lista krain i miejsc, taktyka, zdolności, mikstury, licznik czasu | 1 |
| Raport | tekstowy przebieg walki, łupy, przyciski „Dalej” i „Zgłoś” | 1 |
| Raporty | historia walk z filtrami | 1 |
| Ranking | poziom, sława, gildie | 1 |
| Ustawienia konta | e-mail, hasło, powiadomienia, usunięcie konta | 1 |
| Sklep (Miasto) | mikstury, zwykłe przedmioty, sprzedaż | 2 |
| Zadania | saga, zadania bóstwa, dzienne, osiągnięcia | 1 (saga i zlecenia), 2 (reszta) |
| Twierdza | budynki, kolejka budowy, surowce, produkcja | 3 |
| Koszary | szkolenie, armia, wysyłanie napadów | 4 |
| Mapa | prowincje, właściciele, oblężenia | 4 |
| Gildia | członkowie, skarbiec, czat, oblężenia | 4 |
| Targowisko | oferty, wystawianie, historia | 4 |
| Czat | kanały, prywatne wiadomości, blokady | 4 |
| Panel moderatora | zgłoszenia, kary, dziennik | 4 |

## Baza danych

Baza PostgreSQL z ok. 27 tabelami: lista poniżej plus tabele wersji 1 opisane niżej (admin\_actions, item\_events, gold\_events, game\_events) i w zakładce Bohater i konto (stash – schowek, loot\_mail – poczta łupów, name\_history – historia imion). Dane stałe (potwory, krainy, zestawy, zdolności) trzymamy w plikach w kodzie, nie w bazie, żeby zmiana balansu była jedną poprawką w jednym pliku.

| Tabela | Najważniejsze pola | Wersja |
| --- | --- | --- |
| users | id, e-mail, hasło (zaszyfrowane), rola (gracz / moderator / admin), potwierdzenie 16+, premium do, utworzono | 1 |
| sessions | id, user\_id, wygasa | 1 |
| characters | id, user\_id, serwer, imię, rasa, klasa, bóstwo, poziom, PD, SIŁ / ZRĘ / WYT / INT, wolne punkty, złoto w sakwie, wytrwałość + czas ostatniej aktualizacji, ranny do, sława | 1 |
| items | id, właściciel, szablon lub wygenerowany, slot, poziom, jakość, obrażenia / pancerz, cechy (JSON), ulepszenie, runa, założony | 1 |
| expeditions | id, postać, miejsce, start, koniec, taktyka, zdolności, mikstury, rozliczona | 1 |
| battle\_reports | id, postać, przeciwnik, ziarno losowości, wynik, tury (JSON), łupy, data | 1 |
| boss\_attempts | postać, boss, dzień | 1 |
| consumables | postać, rodzaj mikstury, ilość | 2 |
| quests\_progress | postać, zadanie, stan, licznik | 1 |
| achievements | postać, osiągnięcie, data; character\_titles: postać, tytuł, zdobyty, aktywny (od wersji 1, bonusy włączane w aktualizacji) | 2 |
| fortresses | id, postać, poziomy budynków (JSON), surowce, ostatnie przeliczenie produkcji, ochrona do | 3 |
| build\_queue | twierdza, budynek, poziom, koniec | 3 |
| armies | twierdza, typ jednostki, liczba, w szkoleniu do | 4 |
| raids | atakujący, cel, armia (JSON), dotarcie, wynik | 4 |
| guilds, guild\_members | nazwa, przywódca, skarbiec; członkowie i rangi | 4 |
| provinces | id, region, strefa, właściciel, ochrona do, bonus | 4 |
| sieges | prowincja, gildia, ogłoszono, termin bitwy, wynik | 4 |
| market\_offers | sprzedający, przedmiot lub surowiec, cena, wygasa, kupiec | 4 |
| chat\_messages, reports, sanctions, login\_log | czat, zgłoszenia, kary, logowania (IP 90 dni) | 4 |

**Zasada bezpieczeństwa:** każda operacja zmieniająca złoto, przedmioty lub surowce dzieje się w jednej transakcji bazy, żeby dwa kliknięcia naraz nie zduplikowały przedmiotu.

## Kolejność budowy

Budujemy w 4 wersjach; każda kończy się grą, którą da się pokazać znajomym. Każdy krok to jedna sesja w VS Code: ja piszę kod, Ty uruchamiasz i klikasz.

1. **Przygotowanie**: instalacja VS Code, Node.js, Git, rozszerzenia Claude Code, konto GitHub; pusty projekt Next.js uruchomiony na Twoim komputerze.
2. **Silnik walki** jako osobny moduł z testami: wzory z zakładki Systemy walki, ziarno losowości, generowanie raportu. Najpierw bez strony, tylko testy.
3. **Baza i logowanie**: tabele wersji 1, rejestracja z potwierdzeniem 16+, logowanie.
4. **Bohater**: tworzenie, ekran statystyk, rozdawanie punktów.
5. **Wyprawy i raporty**: wytrwałość, czas, rozliczanie przy wejściu, łupy z generatora przedmiotów, bossowie Szczerbaty Krul i Morwena.
6. **Ekwipunek i ranking**: zakładanie, porównanie, ranking poziomu; zadania fabularne i zlecenia rozdziałów I–II, które odblokowują lokacje.
7. **Publikacja wersji 1**: hosting, domena, regulamin i polityka prywatności, zamknięte testy z 10–20 znajomymi.
8. **Wersja 2**: sklep, mikstury, zdolności klas, żywioły, saga rozdziały III–VI, zadania bóstw i dzienne, łowy.
9. **Wersja 3**: twierdza, budynki, produkcja, kuźnia (ulepszanie, runy), zestawy.
10. **Wersja 4**: PvP i sława, wojsko, napady, gildie, prowincje, targowisko, czat, moderacja, Premium (19,99 zł) i płatności.

Po każdej wersji powtarzamy symulację balansu z prawdziwym kodem walki, a dopiero potem otwieramy grę dla kolejnych graczy.

## Panel admina

Panel to część tej samej aplikacji pod adresem /admin, widoczna tylko dla ról admin i moderator. Wersja 1 dostaje podstawowe narzędzia (pierwsze 6 w tabeli), reszta przychodzi z funkcjami, których dotyczy.

**Role:**

| Rola | Kto | Uprawnienia |
| --- | --- | --- |
| Admin | Ty | wszystko, w tym edycja postaci, zwroty, ustawienia gry, nadawanie ról |
| Moderator | 2–3 zaufanych graczy, później | zgłoszenia, wyciszenia, blokady do 30 dni, wymuszenie zmiany imienia; bez edycji postaci i zwrotów |

**Funkcje:**

| Funkcja | Co robi | Wersja |
| --- | --- | --- |
| Wyszukiwarka graczy | po imieniu, e-mailu, ID; profil z poziomem, złotem, ekwipunkiem, ostatnimi logowaniami | 1 |
| Historia gracza | raporty walk, zdobyte i utracone przedmioty, ruchy złota, zmiany imienia | 1 |
| Edycja postaci | zmiana poziomu, PD, złota, punktów statystyk, ekwipunku; zawsze z obowiązkowym powodem | 1 |
| Zwrot przedmiotu | przywrócenie przedmiotu z historii jednym kliknięciem (np. po błędzie gry) | 1 |
| Blokady | wyciszenie czatu, blokada handlu, blokada konta z datą końca i powodem widocznym dla gracza | 1 |
| Tryb przerwy technicznej | gra pokazuje komunikat, logowanie tylko dla admina; wyprawy w trakcie dostają doliczony czas przerwy | 1 |
| Ogłoszenia | pasek z komunikatem dla wszystkich (np. „Aktualizacja o 22:00”) | 2 |
| Nagroda dla wszystkich | np. przeprosiny po awarii: złoto, mikstury, wytrwałość dla każdego aktywnego gracza | 2 |
| Przełączniki funkcji | włączanie funkcji bez nowego wdrożenia (np. bonusy tytułów, nowe krainy) | 2 |
| Gospodarka | suma złota w grze, przyrost tygodniowy, top 20 najbogatszych, podejrzane transfery | 4 |
| Kolejka zgłoszeń | zgłoszenia graczy z kontekstem czatu lub raportu, przypisanie do moderatora | 4 |
| Sezony PvP | podgląd rankingu, ręczne zakończenie sezonu w razie błędu | 4 |

**Dziennik działań:** każda akcja w panelu zapisuje kto, kiedy, co zmienił (wartość przed i po) i dlaczego. Wpisów nie da się usunąć ani edytować, także adminowi.

**Bezpieczeństwo:**

- logowanie do panelu tylko z weryfikacją dwuetapową (aplikacja z kodami)
- sesja panelu wygasa po 30 min bezczynności
- każda zmiana złota lub przedmiotów powyżej progu (np. 100 000 złota, przedmiot legendarny) wymaga potwierdzenia drugim kliknięciem z wpisaniem powodu
- admin nie ma własnej postaci z dodatkowymi uprawnieniami w grze; konto gracza i konto admina są osobne

**Nowe tabele w bazie:** `admin_actions` (dziennik działań), `item_events` (każde pojawienie się, zmiana właściciela i zniknięcie przedmiotu), `gold_events` (każdy ruch złota z przyczyną). Dwie ostatnie służą też do zwrotów i wykrywania oszustw.

## Kopie zapasowe i awarie

Cel: po najgorszej awarii gracze tracą maks. kilka minut gry (z płatnym planem bazy) albo maks. dobę (na darmowym), a gra wraca w ciągu 2 godzin.

**Dwie warstwy kopii:**

| Warstwa | Jak | Jak często | Ile trzymamy |
| --- | --- | --- | --- |
| Odtwarzanie do punktu w czasie | wbudowane w płatny plan bazy (Neon lub Supabase); włączyć przed startem publicznym, cennik sprawdzić przed decyzją | ciągle | wg planu, min. 7 dni |
| Własna kopia pełna | automatyczne zadanie w GitHub Actions o 03:00: zrzut bazy (pg\_dump), szyfrowanie, wysyłka do osobnego magazynu plików u innej firmy niż baza (np. Cloudflare R2 lub Backblaze B2) | codziennie | 14 dziennych, 8 tygodniowych, 12 miesięcznych |

Kod gry jest w GitHubie, a hasła i klucze w menedżerze haseł; bez nich nie da się postawić gry od nowa, więc nigdy nie trzymamy ich tylko na jednym komputerze.

**Test przywracania** raz w miesiącu: przywracamy wczorajszą kopię do bazy testowej i sprawdzamy, czy zgadza się liczba graczy, postaci i przedmiotów. Kopia, której nikt nie przywrócił, nie jest pewną kopią.

**Procedura awarii:**

1. Włączyć tryb przerwy technicznej w panelu admina (albo zmienną środowiskową, jeśli panel nie działa).
2. Ustalić, co się stało i od kiedy (dziennik błędów, ostatnie wdrożenie).
3. Jeśli błąd jest w kodzie, cofnąć wdrożenie do poprzedniej wersji (jedno kliknięcie w hostingu).
4. Jeśli dane są zepsute, przywrócić bazę do chwili tuż przed awarią do nowej bazy, sprawdzić ją i przełączyć grę na nią.
5. Wyprawom i budowom w trakcie doliczyć czas przerwy.
6. Wyłączyć przerwę, opublikować ogłoszenie z wyjaśnieniem i dać graczom rekompensatę (nagroda dla wszystkich).

**RODO a kopie:** usunięte konto zostaje w kopiach do końca ich okresu przechowywania (maks. 12 miesięcy). Polityka prywatności musi o tym mówić, a po przywróceniu starej kopii konta usunięte w międzyczasie usuwamy ponownie (lista usunięć trzymana osobno).

## Pomiar gry

Mierzymy we własnej bazie, bez zewnętrznej analityki i bez śledzących cookies (zgodnie z sekcją Prawo). Dane służą tylko do balansu i naprawy gry, są usuwane razem z kontem i opisane w polityce prywatności. Wyniki widać w panelu admina.

**Zdarzenia zapisywane w tabeli `game_events`** (gracz, rodzaj, czas, kilka pól szczegółów):

| Zdarzenie | Szczegóły |
| --- | --- |
| rejestracja, logowanie | — |
| utworzenie bohatera | rasa, klasa, bóstwo |
| krok samouczka | numer kroku (1–8) |
| wyprawa: start | lokacja, rodzaj, taktyka, zdolności |
| walka: wynik | już w battle\_reports: wynik, tury, PŻ na końcu |
| awans | nowy poziom, czas od rejestracji |
| zadanie ukończone | zadanie, czas od odblokowania |
| boss: próba | boss, wynik, poziom gracza |
| reset statystyk, zmiana imienia | rozkład punktów przed i po |
| ulepszenie | poziom docelowy, wynik |
| zakup Premium | okres (bez danych płatności, te ma operator) |

**Wskaźniki:**

| Wskaźnik | Po co | Cel |
| --- | --- | --- |
| Powroty po 1, 7 i 30 dniach | czy gra wciąga | D1 ≥ 40%, D7 ≥ 20%, D30 ≥ 10% |
| Ukończenie samouczka | czy start jest jasny | ≥ 80% |
| Gdzie gracze odchodzą | który krok samouczka lub poziom gubi ludzi | brak kroku, na którym odpada ≥ 20% |
| Czas do poziomów 10 / 25 / 50 | czy tempo zgadza się z planem 90 dni | ±20% od zakładki Balans |
| Wygrane ze zwykłymi potworami wg klasy | balans klas | 90–100% przy własnym poziomie |
| Wygrane z bossami wg klasy | balans klas | 20–60% przy poziomie bossa, żadna klasa poza tym zakresem |
| Rozkład wybranych klas i ras | czy któraś nie jest martwa lub dominująca | każda klasa 10–25% graczy |
| Średnia walk dziennie na aktywnego gracza | czy założenie 25 jest trafne | 15–35 |
| Złoto w grze | inflacja | przyrost ≤ 10% tygodniowo |
| Odsetek z Premium | zarabianie | punkt odniesienia, bez celu na wersję 1 |

**Testy zamknięte (wersja 1):** 10–20 znajomych przez 14 dni. Uznajemy je za udane, gdy:

- ≥ 80% kończy samouczek, a ≥ 50% wraca następnego dnia
- nie ma błędu, który blokuje grę lub traci przedmioty, i jest maks. 5 poważnych błędów na liście poprawek
- każda klasa mieści się w zakresach z tabeli wyżej (przy tak małej grupie dodatkowo patrzymy na symulację)
- ankieta na koniec (5 pytań, skala 1–5): czy raporty są ciekawe, czy tempo jest dobre, czy wiadomo, co robić dalej, co frustruje, czy polecił(a)byś grę; średnia ≥ 3,5

Gdy cel nie jest spełniony, poprawiamy i powtarzamy test przed publicznym startem.
