# Balans

## Wyniki symulacji

Po poprawkach wszystkie klasy wygrywają ze zwykłym potworem swojego poziomu, a z bossem swojego poziomu mają 20–70% szans, z bossem 5 poziomów niżej 78–100%. Przed poprawkami Łucznik i Łotr wygrywali z bossem w 100%, a Wojownik i Mag w 0%.

**Metoda:** 300 walk na każdą kombinację klasy, poziomu i przeciwnika; bohater rozdaje 2 punkty na poziom w statystykę główną i 1 w WYT, nosi magiczne przedmioty swojego poziomu; bez zdolności, mikstur i zestawów (te dodadzą ok. 15–25%).

**Cele:** zwykły potwór ok. 95–100% wygranych w 4–10 turach; boss swojego poziomu 25–50% (wyzwanie, warto się przygotować); boss przy przewadze 5 poziomów ok. 80–95%.

**Wygrane z bossem swojego poziomu:**

| Klasa | Poz. 10 | Poz. 30 | Poz. 50 | Poz. 80 | Poz. 120 |
| --- | --- | --- | --- | --- | --- |
| Wojownik | 43% | 28% | 34% | 51% | 50% |
| Paladyn | 22% | 30% | 42% | 55% | 63% |
| Łucznik | 21% | 24% | 36% | 53% | 58% |
| Łotr | 26% | 27% | 43% | 58% | 71% |
| Mag | 38% | 24% | 34% | 44% | 54% |
| Kapłan | 71% | 34% | 28% | 28% | 43% |

**Średnia liczba tur ze zwykłym potworem:** Wojownik, Łucznik, Łotr, Mag 4–7; Kapłan 8–10; Paladyn 9–12 (klasy obronne zabijają wolniej, ale prawie nie przegrywają).

**Do poprawy w następnej symulacji:**

- Kapłan na poziomie 10 jest za silny przeciw bossowi (71%), a później słabnie; leczenie powinno rosnąć z INT zamiast być stałe 15%.
- Łotr na wysokich poziomach rośnie najszybciej (71% na 120); obniżyć mnożnik sztyletu z 0,55 do 0,50 albo krytyk Łotra.
- Paladyn walczy długo (do 12 tur); sprawdzić, czy gracze nie uznają tego za nudne.
- Wszystkie wyniki powtórzyć po zakodowaniu zdolności, mikstur, zestawów i ulepszeń do +10 (krok 2 w zakładce Technika).

## Trzecia symulacja (pełny ekwipunek) – do przeglądu z Patrykiem

Po wdrożeniu zdolności, mikstur, zestawów, ulepszeń kowala do +10 i bonusów bóstw (`src/game/combat/__tests__/balance.simulation.full.test.ts`, ta sama metoda: 300 walk/klasę/poziom, bossowie swojego poziomu) – bohater "w pełnym rynsztunku" (3 najlepsze odblokowane zdolności, pasek 3 mikstur bojowych, zestaw klasowy 2 cz. od poz. 50/100, ekwipunek +10, bonus bóstwa dopasowanego do klasy) wygrywa z bossem swojego poziomu **97–100% walk w każdej klasie i na każdym poziomie** – zamiast celu 25–50% z tabeli wyżej. Różnica względem drugiej symulacji (bez tych bonusów) to +29 do +80 punktów procentowych, czyli znacznie więcej niż szacowane w GDD „ok. 15–25%”.

**Wniosek:** każdy z osobna system (zdolności, mikstury, zestawy, kowal +10, bóstwa) jest niewielkim bonusem, ale ich **sumowanie w tej samej walce** usuwa wyzwanie z bossów całkowicie – gracz, który w pełni wykorzystuje wszystkie systemy przygotowania, nigdy nie przegrywa z bossem swojego poziomu. To nie jest błąd silnika (liczby się zgadzają ze wzorami z `02-systemy-walki.md`/`08-ekwipunek.md`) – to sygnał, że same wzory bonusów są za duże, gdy się je złoży.

**Nie zmieniono żadnej liczby balansu** (zgodnie z zasadą w `CLAUDE.md`) – to opis problemu, decyzja należy do Patryka. Możliwe kierunki do wyboru:

1. Zmniejszyć pojedyncze bonusy (np. mikstury z +15/+20% na +8/+10%, premię 2 cz. zestawu o połowę) – najmniej inwazyjne, ale trudno dobrać właściwą skalę bez kolejnej symulacji.
2. Wprowadzić redukcję przy sumowaniu (np. bonusy procentowe multiplikatywne, nie addytywne, albo "diminishing returns" powyżej pewnego sumarycznego %) – bardziej systemowe, ale nowa mechanika.
3. Podnieść bazowe staty bossów swojego poziomu (PŻ/obrona/atak), żeby nadrabiały przewagę w pełnym przygotowaniu – zgodne z duchem "boss to wyzwanie, warto się przygotować", ale wymaga też utrzymania sensownych walk dla gracza BEZ przygotowania (patrz druga symulacja, 21–71%).
4. Zaakceptować wynik: granie "na pełnym wyposażeniu" ma być łatwe, a wyzwaniem są bossowie ponadpoziomowi albo arena PvP – wymaga tylko aktualizacji opisu celu w tym pliku, bez zmian w kodzie.

Założenia doboru bóstwa/łaski dla tej symulacji są opisane w komentarzu przy `buildFullGearTestHero` w `src/game/combat/equipment.ts`.

## Tempo gry

Cel: aktywny gracz osiąga poziom 120 po ok. 90 dniach. Poprzednia krzywa (100 × poziom^1,5 przy 10 PD za poziom potwora) wymagała ok. 8 600 walk, czyli ok. 290 dni.

```latex
\text{PD na kolejny poziom} = 34 \cdot \text{poziom}^{1{,}7} \qquad \text{PD za potwora} = 25 \cdot \text{poziom potwora}
```

**Założenia:** aktywny gracz to ok. 25 wygranych walk dziennie (3–4 wejścia), okazjonalny ok. 12. Bossowie, zadania i nagrody dzienne dokładają ok. 20% PD. Maksymalnie wytrwałość pozwala na ok. 38 wypraw dziennie, więc nikt nie przyspieszy wielokrotnie.

| Poziom | Wygrane walki od startu | Aktywny gracz (25 / dzień) | Okazjonalny gracz (12 / dzień) |
| --- | --- | --- | --- |
| 10 | 30 | 1 dzień (z bonusem pierwszej doby) | 2–3 dni |
| 25 | 153 | 6 dni | 13 dni |
| 50 | 507 | 20 dni | 42 dni |
| 80 | 1 134 | 45 dni | 95 dni |
| 100 | 1 660 | 66 dni | 138 dni |
| 120 | 2 267 | 91 dni | 189 dni |

Poziomy 121–200 po aktualizacji X powinny zająć aktywnemu graczowi kolejne ok. 90–120 dni; krzywą dla nich ustalimy razem z aktualizacją.
