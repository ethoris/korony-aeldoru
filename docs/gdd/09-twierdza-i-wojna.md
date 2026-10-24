# Twierdza i wojna

## Produkcja i magazyn

Budynki surowcowe produkują przez całą dobę, a nadwyżka ponad pojemność magazynu przepada. Produkcja liczy się przy wejściu gracza z czasu, który upłynął (bez procesów w tle).

```latex
\text{produkcja na godzinę} = 30 \cdot \text{poziom budynku}^{1{,}2}
```

```latex
\text{pojemność magazynu} = 1000 + 1500 \cdot \text{poziom}^{1{,}5}
```

| Poziom budynku | Produkcja / h | Pojemność magazynu | Ochrona przed rabunkiem |
| --- | --- | --- | --- |
| 1 | 30 | 2 500 | 12% |
| 5 | 207 | 17 800 | 20% |
| 10 | 475 | 48 400 | 30% |
| 15 | 773 | 88 100 | 40% |
| 20 | 1 092 | 135 200 | 50% |

- **Złoto** nie ma budynku: przychodzi z wypraw, podatku z prowincji i handlu. Skarbiec mieści 10× pojemność magazynu.
- **Mana** z Wieży Magów: 20% produkcji zwykłego budynku tego poziomu.
- **Żywność** zjada wojsko: każda jednostka 1–4 żywności na godzinę. Gdy brakuje, jednostki tracą 50% siły, ale nie giną.
- **Bonus prowincji**: +10% produkcji jednego surowca dla właściciela.

## Koszty i czasy budynków

Koszt rośnie × 1,3, a czas × 1,25 na każdy kolejny poziom. Budynek nie może mieć wyższego poziomu niż Ratusz. Krasnoludy płacą i czekają o 15% mniej.

```latex
\text{koszt}(p) = \text{koszt bazowy} \cdot 1{,}3^{\,p-1} \qquad \text{czas}(p) = \text{czas bazowy} \cdot 1{,}25^{\,p-1}
```

| Budynek | Koszt bazowy (drewno / kamień / żelazo / złoto) | Czas bazowy | Czas na poz. 20 | Co odblokowuje poziomami |
| --- | --- | --- | --- | --- |
| Ratusz | 120 / 120 / 40 / 50 | 10 min | 11,6 h | limit poziomu pozostałych budynków |
| Tartak | 40 / 30 / 0 / 0 | 3 min | 3,5 h | — |
| Kamieniołom | 50 / 20 / 0 / 0 | 3 min | 3,5 h | — |
| Kopalnia | 60 / 50 / 0 / 0 | 4 min | 4,6 h | — |
| Farma | 40 / 20 / 0 / 0 | 3 min | 3,5 h | — |
| Magazyn | 60 / 60 / 10 / 0 | 4 min | 4,6 h | pojemność i ochrona |
| Kuźnia | 80 / 100 / 60 / 40 | 8 min | 9,3 h | 5: ulepszanie +1–5; 8: runy żywiołów; 12: ulepszanie +6–10; 20: wykuwanie zestawów II; po aktualizacji X rozbudowa Gwiezdne kowadło: ulepszanie +11–20 |
| Świątynia | 90 / 120 / 20 / 80 | 8 min | 9,3 h | 1: zadania bóstwa; 5: leczenie ran; co 5 poz. bonus bóstwa +25% |
| Wieża Magów | 100 / 150 / 80 / 120 | 12 min | 13,9 h | 1: mana; 10: drugi żywioł Maga do wyboru |
| Koszary | 100 / 80 / 60 / 40 | 8 min | 9,3 h | 1: piechota; 5: łucznicy; 10: rycerze; 15: magowie bitewni; 20: machiny |
| Mury | 80 / 160 / 40 / 0 | 6 min | 6,9 h | +5% obrony wojsk na murach za poziom |
| Targowisko | 100 / 60 / 20 / 60 | 6 min | 6,9 h | 1: handel; 10: −1 pkt % podatku; 20: podatek 3% |

Przykład: Ratusz na poziom 10 kosztuje 1 273 drewna, 1 273 kamienia, 424 żelaza i 530 złota, a buduje się 1,2 h.

## Jednostki

Wojsko z Koszar służy do napadów na twierdze i oblężeń prowincji; bohater nie walczy nim na wyprawach. Jednostki działają jak kamień, papier, nożyce: każda ma typ, nad którym ma przewagę (+50% ataku).

| Jednostka | Koszary | Atak | Obrona | PŻ | Koszt (drewno / żelazo / żywność / złoto) | Szkolenie | Żywność / h | Ładowność | Przewaga nad |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Włócznik | 1 | 8 | 12 | 40 | 20 / 30 / 20 / 5 | 2 min | 1 | 20 | rycerze |
| Łucznik | 5 | 12 | 6 | 30 | 40 / 10 / 20 / 10 | 3 min | 1 | 10 | włócznicy |
| Rycerz | 10 | 20 | 18 | 80 | 30 / 80 / 50 / 40 | 8 min | 3 | 40 | łucznicy |
| Mag bitewny | 15 | 30 | 6 | 40 | 20 / 20 / 40 / 100 + 20 many | 12 min | 2 | 5 | ignoruje 50% bonusu murów |
| Taran | 20 | 5 | 10 | 200 | 200 / 100 / 0 / 80 | 20 min | 4 | 0 | mury: −1 poziom muru za każde 10 taranów |

**Limit wojska** = 50 × poziom Koszar (poziom 20: 1 000 jednostek). Jednostki przegrane w napadzie giną; obrońca odzyskuje 30% poległych w Świątyni.

**Bohater w wojsku:** jeśli bohater idzie z armią, dodaje do niej swój Atak i PŻ oraz +10% morale (siły) wszystkich jednostek. Ryzyko: przy przegranej dostaje ranę.

## Napady i oblężenia

Bitwy wojsk liczy jeden wzór porównujący siłę obu stron; zwycięzca bierze wszystko, a straty zależą od przewagi.

```latex
\text{siła} = \sum (\text{atak lub obrona jednostki} \cdot \text{liczba} \cdot \text{bonusy})
```

- **Atakujący** liczy Atak jednostek (+50% tam, gdzie ma przewagę typu nad przeważającym typem obrońcy).
- **Obrońca** liczy Obronę × (1 + 5% × poziom Murów) + garnizon prowincji.
- **Wynik**: większa siła wygrywa. Przegrany traci wszystkie wysłane jednostki, zwycięzca traci (siła słabszego ÷ siła silniejszego)^1,5 swoich, np. przy przewadze 2:1 traci 35%.
- **Losowość**: ±10% siły obu stron, żeby bitwy na styk nie były przewidywalne.

**Napad na twierdzę** (od poziomu 15 bohatera): marsz trwa 10–60 min zależnie od odległości na mapie. Zwycięzca zabiera surowce do ładowności armii, maks. 20% zapasów ponad ochronę Magazynu. Tę samą twierdzę można napaść maks. 2 razy na dobę.

**Oblężenie prowincji** (od poziomu 20):

1. Gildia ogłasza oblężenie najpóźniej 12 h wcześniej; obrońcy dostają powiadomienie.
2. Bitwa odbywa się w oknie 18:00–22:00 czasu serwera, żeby nikt nie tracił prowincji w nocy.
3. Obrońcy i ich gildia mogą wysłać posiłki do prowincji przed bitwą.
4. Prowincja niczyja ma garnizon NPC: siła = 200 × numer strefy mapy (strefy 1–5, im bliżej stolicy, tym mocniej).
5. Po zdobyciu prowincja ma 48 h ochrony przed kolejnym oblężeniem.

**Limity:** 1 prowincja na gracza, maks. 6 na gildię. Region = 10 prowincji; gildia z największą liczbą prowincji w regionie mianuje lorda.
