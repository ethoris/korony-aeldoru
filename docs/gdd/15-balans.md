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
