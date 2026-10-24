# Korony Aeldoru – instrukcje dla Claude Code

Tekstowa gra MMORPG fantasy w przeglądarce (PL). Pełna specyfikacja jest w `docs/gdd/` i jest jedynym źródłem prawdy: gdy kod i GDD się różnią, wygrywa GDD; gdy GDD jest niejasne lub sprzeczne, zapytaj właściciela projektu (Patryk), zamiast zgadywać.

Właściciel nie programuje. Ty piszesz kod, testy i polecenia; on uruchamia grę i sprawdza ją w przeglądarce. Wyjaśniaj po polsku, krótko, bez żargonu. Gdy prosisz o kliknięcie lub komendę, podawaj dokładną komendę dla Windows (PowerShell).

## Mapa GDD

| Plik | Zawartość |
| --- | --- |
| 00-glowny.md | wizja, świat, rasy, klasy, zakres wersji 1, technologia |
| 01-bohater-i-konto.md | reset statystyk, plecak / schowek / poczta łupów, imiona |
| 02-systemy-walki.md | **wzory walki (obowiązujące)**, żywioły, zdolności klas, porażka, sława PvP |
| 03-teksty-raportow.md | pula tekstów raportów, znaczniki, odmiana liczebników |
| 04-bestiariusz.md | 36 potworów + 12 bossów, wzory statystyk, typy, żywioły |
| 05-lokacje.md | 72 lokacje (42 na start), czasy, wytrwałość, rodzaje wypraw |
| 06-zadania.md | odblokowanie lokacji fabułą, zadania fabularne i zlecenia, nagrody |
| 07-tytuly.md | tytuły (bonusy włączane w późniejszej aktualizacji) |
| 08-ekwipunek.md | sloty, wzory przedmiotów, losowe cechy, łupy, zestawy, unikaty, ulepszanie |
| 09-twierdza-i-wojna.md | produkcja, budynki, jednostki, napady, oblężenia (wersja 3–4) |
| 10-prowincje.md | mapa 50 prowincji (wersja 4) |
| 11-gospodarka-i-zadania.md | mikstury, sklep, przepływ złota, saga, zadania bóstw i dzienne |
| 12-spolecznosc.md | samouczek, czat i moderacja, multikonta, prawo (RODO, 16+) |
| 13-technika.md | ekrany, baza danych, kolejność budowy, panel admina, kopie, pomiar gry |
| 14-wyglad.md | czcionki, kolory, zasady interfejsu |
| 15-balans.md | wyniki symulacji, tempo gry (90 dni do poz. 120) |

Uwaga: wzory w `02-systemy-walki.md` zastępują wcześniejsze wzory opisane w `00-glowny.md`, jeśli gdziekolwiek się różnią.

## Stos technologiczny

- Next.js (App Router) + TypeScript (strict)
- PostgreSQL na Neon + Prisma
- Auth.js (e-mail + hasło), potwierdzenie wieku 16+ przy rejestracji
- Tailwind CSS z tokenami kolorów z `14-wyglad.md` (motyw ciemny domyślny + jasny), czcionki przez `next/font` (Cinzel, Crimson Pro, Inter)
- Hosting: Vercel (Hobby na testy, Pro przed włączeniem płatności)
- Testy: Vitest dla logiki gry

## Zasady architektury (obowiązkowe)

1. **Cała logika gry na serwerze.** Walka, łupy, czas, złoto – wyłącznie w kodzie serwera. Przeglądarka tylko wyświetla wyniki.
2. **Silnik walki jako czysty moduł** (`src/game/combat/`): bez bazy i bez Next.js, deterministyczny dla danego ziarna (seed), w pełni pokryty testami.
3. **Dane gry w plikach** (`src/game/data/`): potwory, lokacje, przedmioty, zdolności, zadania, teksty raportów, tytuły. Zmiana balansu = zmiana jednego pliku.
4. **Czas bez procesów w tle.** Wyprawy, budowy, wytrwałość i produkcja zapisują znacznik czasu; wynik liczy się przy następnym zapytaniu gracza.
5. **Transakcje.** Każda zmiana złota, przedmiotów lub surowców w jednej transakcji bazy; zapis do `gold_events` / `item_events`.
6. **Polski w tekstach gracza.** Odmiana liczebników funkcją (1 obrażenie / 2–4 obrażenia / 5+ obrażeń), imiona tylko w mianowniku, czasowniki w czasie teraźniejszym (zob. `03-teksty-raportow.md`).
7. **Bez zewnętrznej analityki i śledzących cookies.** Pomiar gry we własnej tabeli `game_events`.
8. **Sekrety tylko w `.env.local` / zmiennych środowiskowych**, nigdy w repozytorium.

## Kolejność pracy

Realizuj kroki z `13-technika.md` („Kolejność budowy”) po kolei. Wersja 1 = kroki 1–7. Nie zaczynaj kolejnego kroku, dopóki poprzedni nie działa i nie ma zielonych testów. Po każdym kroku: krótkie podsumowanie po polsku, co zrobiono, jak to sprawdzić w przeglądarce, i commit w Git (Conventional Commits).

Zakres wersji 1 (z GDD): rejestracja i logowanie, tworzenie bohatera, ekran bohatera z rozdawaniem punktów i resetem, wyprawy w krainach 1–2 (11 lokacji) z czasem i wytrwałością, silnik walki i raporty tekstowe, łupy i ekwipunek (plecak, schowek, poczta łupów, bez ulepszania), bossowie Szczerbaty Krul i Morwena, zadania fabularne i zlecenia rozdziałów I–II, ranking, podstawowy panel admina, `game_events`, regulamin i polityka prywatności (szkic).

## Czego nie robić bez pytania

- nie zmieniaj liczb balansu z GDD (wzory, statystyki, szanse); jeśli test pokazuje problem, opisz go i zaproponuj zmianę
- nie dodawaj płatności, PvP, twierdzy ani gildii przed wersjami 3–4
- nie kopiuj nazw, tekstów ani grafik z innych gier
