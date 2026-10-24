# Społeczność i bezpieczeństwo

## Samouczek

Nowy gracz ma w 10 minut zrozumieć pętlę gry: wyprawa, raport, łup, rozwój. Samouczek jest częścią rozdziału I sagi, więc nie wygląda jak instrukcja.

1. **Tworzenie bohatera**: rasa, klasa, bóstwo; każda opcja ma krótki opis i jedno zdanie „dla kogo”.
2. **Pierwsza wyprawa** trwa 30 sekund (zamiast 5 min) na wściekłego szczura; raport z podświetlonymi elementami: trafienie, krytyk, łup.
3. **Ekwipunek**: zakładanie łupu z wyprawy, porównanie z obecnym przedmiotem (zielona / czerwona strzałka).
4. **Awans i punkty**: po 2 wyprawach bohater dostaje poziom 2 i rozdaje 3 punkty z podpowiedzią dla swojej klasy.
5. **Taktyka i zdolności**: zmiana taktyki przed trzecią wyprawą i jej wpływ widoczny w raporcie.
6. **Sklep i mikstury**: zakup 2 małych mikstur życia za złoto z wypraw.
7. **Wytrwałość i czas**: wyjaśnienie, że wyprawy trwają i warto wrócić później; propozycja powiadomień.
8. **Pierwszy boss** (Szczerbaty Krul) jako cel na pierwsze dni; od poziomu 5 podpowiedź o twierdzy.

Przez pierwsze 24 h wyprawy w Szepczącym Lesie trwają o połowę krócej (nieaktualne od zmiany czasu wyprawy na 0 min — zob. docs/gdd/05-lokacje.md, bonus jest teraz zawsze bez efektu), a przez 7 dni od utworzenia bohatera gracz ma ochronę przed pojedynkami PvP od innych graczy (osobno od 7 dni ochrony twierdzy po jej założeniu, docs/gdd/09-twierdza-i-wojna.md).

## Czat i moderacja

Czat jest potrzebny dla gildii i handlu, ale to też największe źródło problemów w grze publicznej, więc zasady muszą działać od pierwszego dnia.

**Kanały:** ogólny serwera, handlowy, gildii, prywatne wiadomości. Pisać na kanale ogólnym można od poziomu 5 (blokuje spam z nowych kont).

**Automatyka:**

- filtr wulgaryzmów i linków (linki tylko na kanale gildii)
- limit: 1 wiadomość na 3 s, maks. 300 znaków
- blokowanie gracza (jego wiadomości znikają dla blokującego)
- przycisk **Zgłoś** przy każdej wiadomości, raporcie i profilu; zgłoszenie zapisuje kontekst 20 wiadomości

**Kary** (stopniowane, każda zapisana w historii konta z powodem):

| Przewinienie | Kara |
| --- | --- |
| spam, wulgaryzmy | wyciszenie 1 h → 24 h → 7 dni |
| obrażanie, nękanie | wyciszenie 7 dni → blokada konta 30 dni |
| oszustwo w handlu | zwrot przedmiotów, blokada handlu 30 dni |
| multikonta, boty, błędy wykorzystywane celowo | blokada konta, usunięcie zysków |
| treści nielegalne, groźby | trwała blokada, zgłoszenie odpowiednim służbom |

**Panel moderatora:** lista zgłoszeń, podgląd kontekstu, nałożenie kary jednym kliknięciem, dziennik działań moderatorów. Na start moderatorem jesteś Ty; później 2–3 zaufanych graczy z ograniczonymi uprawnieniami (bez usuwania kont).

## Multikonta i oszustwa

Zasada: jedno konto na osobę na serwer. Gra nie próbuje wykryć wszystkiego automatycznie; zbiera sygnały i pokazuje je moderatorowi, który decyduje.

**Ochrona w samych zasadach gry** (najtańsza i najskuteczniejsza):

- handel bezpośredni od poziomu 10, przedmioty zestawów nie trafiają na targowisko
- zero nagród za walkę z nieaktywnymi graczami i maks. 3 ataki na tego samego gracza dziennie
- przekazanie złota lub przedmiotu za wyraźnie zaniżoną cenę (poniżej 30% średniej) wymaga 24 h na akceptację i trafia do kontroli
- wszystkie obliczenia na serwerze; każda walka ma zapisane ziarno losowości do odtworzenia

**Sygnały dla moderatora:**

- wiele kont logujących się z tego samego adresu IP i tej samej przeglądarki (w gospodarstwach domowych to bywa normalne: domownicy mogą zgłosić wspólne IP w ustawieniach)
- handel tylko w jedną stronę między tymi samymi kontami
- **boty**: działania w równych odstępach przez wiele godzin bez przerwy; po 200 akcjach w ciągu godziny prosta weryfikacja (captcha)
- nienaturalne zyski złota lub doświadczenia w porównaniu ze średnią dla poziomu

**Dane i prywatność:** adres IP i identyfikator przeglądarki to dane osobowe, więc trzymamy je maks. 90 dni, tylko do ochrony gry, i opisujemy to w polityce prywatności.

## Prawo

Publiczna gra z kontami, czatem i płatnościami potrzebuje kilku dokumentów i ustawień przed startem. To lista robocza, nie porada prawna; przed włączeniem płatności warto dać regulamin do sprawdzenia prawnikowi.

- **Wiek: 16+.** W Polsce dziecko może samo zgodzić się na przetwarzanie danych w usługach internetowych od 16 lat; polska ustawa nie obniżyła tego progu ([pit.pl](https://www.pit.pl/?p=30737)). Rejestracja ma pole „mam ukończone 16 lat”, a zakup Premium wymaga pełnoletności lub zgody rodzica.
- **Regulamin**: zasady gry, kary i odwołania, konta, Premium, reklamacje, zakaz multikont i botów, prawo do zmian balansu. Usługa elektroniczna wymaga regulaminu udostępnionego przed rejestracją.
- **Polityka prywatności (RODO)**: jakie dane zbieramy (e-mail, IP, dane gry), po co, jak długo, kto ma dostęp (hosting), prawo do usunięcia konta i danych. Gra musi mieć przycisk usunięcia konta.
- **Cookies**: cookie logowania i sesji nie wymaga zgody, ale analityka i śledzenie tak; zgoda ma być dobrowolna i możliwa do wycofania ([art. 399–400 Prawa komunikacji elektronicznej](https://edlaw.eduverse.com/docs/jurisdiction/nat/pl/pke)). Najprościej: na start brak analityki zewnętrznej.
- **Treści graczy (czat)**: punkt kontaktowy, przycisk zgłaszania i uzasadnienie przy karze, co wspiera też wymogi unijnych przepisów o usługach cyfrowych.
- **Premium jako treść cyfrowa**: przy zakupie gracz zgadza się na natychmiastowy dostęp i przyjmuje do wiadomości utratę prawa odstąpienia od umowy w 14 dni; bez tego musi móc zrezygnować i odzyskać pieniądze.
- **Podatki**: sprzedaż Premium to przychód; działalność nierejestrowana do limitu albo firma. Do ustalenia z księgowym przed pierwszą płatnością.
