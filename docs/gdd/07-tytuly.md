# Tytuły

Plan na następną aktualizację po starcie gry: tytuły przestają być tylko ozdobą i dają małe bonusy. Na start gry tytuły są zbierane i wyświetlane, ale ich bonusy nie działają; aktualizacja włącza je wszystkim graczom wstecz.

## Zasady

- **Jeden aktywny tytuł:** gracz zbiera dowolnie wiele tytułów, ale wybiera jeden, który wyświetla się przy nicku i daje bonus. Zmiana jest darmowa, poza wyprawą i walką.
- **Slot sezonowy:** tytuły sezonowe PvP (np. „Czempion Areny”) działają automatycznie obok aktywnego tytułu i znikają ze startem następnego sezonu.
- **Małe liczby:** bonus do statystyk z tytułu to maks. +3% (jedyny wyjątek: sezonowy Czempion Areny, +10%), bonus sytuacyjny (przeciw typowi potwora, żywiołowi, w jednej czynności) maks. +5%. Dzięki temu tytuł daje wybór i satysfakcję, ale nie zmienia wyników testu balansu.
- **PvP:** w pojedynkach działają tylko bonusy ogólne (statystyka główna, PŻ, obrona); bonusy sytuacyjne przeciw potworom nie.
- **Rzadkość tytułu** ma kolor jak przedmioty: pospolity (zwykły), rzadki, epicki (legendarny), unikatowy (unikat), sezonowy (złoto).

## Lista tytułów

| Tytuł | Jak zdobyć | Rzadkość | Bonus |
| --- | --- | --- | --- |
| Poszukiwacz Przygód | utworzenie bohatera | pospolity | +1% PD z wypraw |
| Pogromca Krula | pokonanie Szczerbatego Krula | pospolity | +2% złota z wypraw |
| Pogromca Mgieł | rozdział II sagi | rzadki | +5% obrażeń przeciw nieumarłym |
| Przyjaciel Żelaznego Rodu | zlecenie „Sztandar Rodu” | rzadki | −5% kosztu ulepszania |
| Ostatni Legionista | zlecenie „Sztandar Legionu” | rzadki | +3% obrony |
| Głos Smoków | zlecenie „Kość na flet” | epicki | +5% odporności na Ogień |
| Powiernik Króla | zlecenie „Ostatni list króla” | epicki | +5% PD z zadań |
| Łamacz Korony | finał sagi: zniszczenie korony | epicki | +3% obrażeń |
| Koronowany przez Otchłań | finał sagi: założenie korony | epicki | +3% PŻ |
| Łowca Bossów | pokonanie wszystkich 12 bossów do poz. 120 | epicki | +5% obrażeń przeciw bossom |
| Niezłomny | 100 wygranych Głębokich wypraw | rzadki | +3% PŻ w Głębokich wyprawach |
| Mistrz Kuźni | pierwszy przedmiot na +10 | rzadki | +3% szansy ulepszenia |
| Kolekcjoner | pełny zestaw swojej klasy | rzadki | +2% premii z założonego zestawu |
| Pan Twierdzy | wszystkie budynki na poziomie 20 | epicki | +5% produkcji surowców |
| Wierny \[imię bóstwa\] | 5 stopni łaski bóstwa | epicki | bonus bóstwa +10% |
| Pionier Areny | sezon I, min. 10 walk | rzadki | +2% złota z PvP |
| Pierwszy Czempion Aeldoru | zwycięzca sezonu I (jeden na serwer) | unikatowy | +2% głównej statystyki |
| Pogromca Pierwotnego | pierwszy na serwerze, który pokona Pierwotnego Smoka | unikatowy | +2% głównej statystyki |
| Legenda Areny | ranga Legenda na koniec sezonu (do startu następnego) | sezonowy | +3% głównej statystyki |
| Czempion Areny | 1. miejsce w sezonie (do startu następnego) | sezonowy | +10% głównej statystyki |

Nowe tytuły będą dochodzić z aktualizacjami (krainy 7–10, bestiariusz w grze, wojna gildii), zawsze w tych samych limitach.

## Technicznie

Tabela `character_titles` (postać, tytuł, zdobyty, aktywny) od wersji 1, żeby tytuły zdobyte przed aktualizacją były zapisane. Lista tytułów i bonusów w pliku danych w kodzie, jak potwory i przedmioty; włączenie bonusów to jedna flaga.
