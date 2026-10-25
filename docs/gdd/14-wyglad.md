# Wygląd gry

Kierunek: **„kronika przy świecy”** – ciemne, ciepłe tło jak skóra i drewno, złote akcenty jak okucia, a raporty składane szeryfową czcionką jak strony kroniki. Domyślnie tryb ciemny (gra w przerwach i wieczorem, na telefonie), z przełącznikiem na jasny „pergamin”.

## Czcionki

Wszystkie z Google Fonts, na licencji SIL Open Font License (wolno używać w płatnej grze). Polskie znaki trzeba sprawdzić na prototypie każdej czcionki.

| Zastosowanie | Czcionka | Styl |
| --- | --- | --- |
| Logo, nagłówki ekranów, nazwy bossów | Cinzel | wielkie litery jak inskrypcje, 600–700 |
| Raporty walki, opisy lokacji, fabuła | Crimson Pro | szeryfowa, 400 / kursywa dla dialogów, 18 px na telefonie |
| Przyciski, liczby, statystyki, menu | Inter | bezszeryfowa, cyfry tabelaryczne (równa szerokość), 14–16 px |

## Kolory

Wszystkie pary tekst–tło spełniają kontrast WCAG AA (min. 4,5 : 1); wartości sprawdzone obliczeniowo.

| Rola | Ciemny | Jasny (pergamin) |
| --- | --- | --- |
| Tło | #14110F | #F4ECDD |
| Karta / panel | #231E19 | #FBF7EF |
| Linia, ramka | #3D342B | #D8CBB4 |
| Tekst | #EDE4D3 | #2B2118 |
| Tekst drugorzędny | #A89B87 | #6B5B47 |
| Akcent (złoto) | #D4AF37 | #8A6510 |
| Niebezpieczeństwo, PŻ | #E0644B | #A3311F |
| Sukces | #6FA35A | #276B3B |
| Informacja | #5E95C9 | #2F5FB8 |

**Rzadkość przedmiotów** (nazwa przedmiotu w tym kolorze, plus ramka ikony):

| Rzadkość | Ciemny | Jasny |
| --- | --- | --- |
| Zwykły | #B9B2A5 | #6B6459 |
| Magiczny | #6A9BF0 | #2F5FB8 |
| Rzadki | #E8BE48 | #8A6510 |
| Legendarny | #EE8A3A | #A8510F |
| Zestaw | #5CC27A | #276B3B |
| Unikat | #C77DE6 | #7E3BA6 |

Kolor nigdy nie jest jedyną informacją: obok zawsze stoi słowo (Rzadki, Zestaw) albo ikona, dla graczy z zaburzeniami widzenia barw.

**Żywioły** (ikona i kolor liczby obrażeń w raporcie): Fizyczne #A89B87, Ogień #E0603A, Lód #6EC3E8, Błyskawica #D9C84A, Światło #F2E4A5, Cień #9A82C4, Trucizna #7DB34A.

## Interfejs

- **Telefon najpierw:** jedna kolumna, dolne menu z 5 pozycjami (Bohater, Wyprawy, Twierdza, Miasto, Więcej), przyciski min. 44 px wysokości. Na komputerze ta sama kolumna, wyśrodkowana do 720 px, plus boczny panel bohatera. Wdrożone w `src/components/AppShell.tsx` (layout `src/app/(game)/layout.tsx`); Miasto = Targowisko/Sklep/Czat/Gildia, Więcej = PvP/Napady/Mapa/Bóstwo/Ranking/Zadania/Ekwipunek/Konto (+Panel admina dla ADMIN/MODERATOR).
- **Górny pasek:** imię i poziom, trzy cienkie paski: PŻ (czerwony), PD (złoty), wytrwałość (niebieski) z czasem do pełnej. **Odstępstwo (do przeglądu z Patrykiem):** PŻ nie ma jak pokazać poza walką – silnik walki jest bezstanowy między wyprawami (`docs/gdd/02-systemy-walki.md`), postać nie ma trwałego pola "aktualne PŻ" w bazie. Pasek pokazuje więc tylko PD i wytrwałość; PŻ zostaje w raporcie walki jak dawniej. Jeśli to ma się zmienić, potrzebny byłby nowy, trwały stan PŻ postaci (i decyzja, kiedy się regeneruje poza walką).
- **Karty:** każda lokacja, przedmiot i zadanie to karta z ramką #3D342B i zaokrągleniem 8 px; rzadkość widać po kolorze nazwy i lewej krawędzi karty.
- **Raport walki:** jak strona kroniki: inicjał rozdziału (Cinzel), tekst w Crimson Pro, liczby obrażeń pogrubione w kolorze żywiołu, krytyki z ikoną. Na końcu karta łupów i przycisk „Dalej”.
- **Liczniki czasu:** duża cyfra w Inter („12:40”) i pasek postępu; po zakończeniu powiadomienie przeglądarki (jeśli gracz włączył).
- **Porównanie przedmiotów:** dwie kolumny, zmiany na zielono ▲ / czerwono ▼ z liczbą.
- **Ikony:** zestaw game-icons.net (licencja CC BY 3.0, wymaga podpisu autorów na stronie „O grze”); ilustracje lokacji i bossów później, gdy gra zarobi.
- **Animacje:** tylko krótkie przejścia (150–200 ms) i odliczanie; bez efektów, które spowalniają telefon. Ustawienie „ogranicz ruch” je wyłącza.
- **Technicznie:** kolory jako zmienne w Tailwind (motyw ciemny i jasny), czcionki ładowane przez next/font, żeby strona nie migała przy wczytywaniu.
