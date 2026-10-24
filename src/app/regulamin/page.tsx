import Link from "next/link";

export const metadata = { title: "Regulamin — Korony Aeldoru" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-card p-6">
      <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-2 text-sm text-foreground">{children}</div>
    </section>
  );
}

export default function RegulaminPage() {
  return (
    <main className="flex flex-1 justify-center p-4">
      <div className="flex w-full max-w-2xl flex-col gap-6 pb-12">
        <div className="rounded-lg border border-line bg-card p-6">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">
            Regulamin
          </h1>
          <p className="mt-2 text-sm text-muted">
            Wersja robocza na czas testów zamkniętych wersji 1. To nie jest porada prawna — przed
            publicznym startem i włączeniem płatności regulamin zostanie sprawdzony przez prawnika.
          </p>
        </div>

        <Section title="1. Postanowienia ogólne">
          <p>
            Korony Aeldoru („Gra”) to tekstowa gra fantasy MMORPG prowadzona przez Patryka
            (kontakt: <a className="text-accent underline" href="mailto:pat2382@gmail.com">pat2382@gmail.com</a>),
            na razie jako projekt testowy, nie zarejestrowana działalność gospodarcza.
          </p>
          <p>Gra jest dostępna dla osób, które mają ukończone 16 lat.</p>
        </Section>

        <Section title="2. Konto">
          <p>Jedno konto na osobę na serwer. Konto wymaga adresu e-mail i hasła.</p>
          <p>
            Użytkownik odpowiada za bezpieczeństwo swojego hasła i za działania wykonane z jego
            konta.
          </p>
          <p>
            Konto i wszystkie dane gry można usunąć w każdej chwili w ustawieniach konta (
            <Link href="/konto" className="text-accent underline">/konto</Link>
            ). Zasady przechowywania danych po usunięciu opisuje{" "}
            <Link href="/polityka-prywatnosci" className="text-accent underline">
              polityka prywatności
            </Link>
            .
          </p>
        </Section>

        <Section title="3. Zasady rozgrywki">
          <p>
            Wszystkie wyniki wypraw, walk i łupów liczy wyłącznie serwer gry, na podstawie wzorów z
            dokumentacji gry i losowego ziarna zapisanego przy każdej walce. Przeglądarka tylko
            wyświetla wynik.
          </p>
          <p>
            Administracja zastrzega sobie prawo do zmiany balansu gry (wzorów, statystyk, szans) w
            celu poprawy rozgrywki. O istotnych zmianach informujemy w grze.
          </p>
        </Section>

        <Section title="4. Zakazane zachowania">
          <ul className="list-disc pl-5">
            <li>posiadanie więcej niż jednego konta na osobę na serwer (multikonta)</li>
            <li>używanie botów i programów automatyzujących rozgrywkę</li>
            <li>celowe wykorzystywanie błędów gry do nienaturalnych zysków</li>
            <li>oszustwa w handlu między graczami</li>
            <li>obrażanie, nękanie innych graczy, treści nielegalne i groźby</li>
            <li>spam i wulgaryzmy na czacie (po jego wdrożeniu)</li>
          </ul>
          <p>Zgłoszenia przyjmuje administracja pod adresem podanym w punkcie 1.</p>
        </Section>

        <Section title="5. Kary">
          <p>Kary są stopniowane i zapisywane w historii konta z powodem widocznym dla gracza:</p>
          <ul className="list-disc pl-5">
            <li>spam, wulgaryzmy — wyciszenie od 1 h do 7 dni</li>
            <li>obrażanie, nękanie — wyciszenie 7 dni do blokady konta 30 dni</li>
            <li>oszustwo w handlu — zwrot przedmiotów, blokada handlu 30 dni</li>
            <li>multikonta, boty, celowe błędy — blokada konta, usunięcie nieuprawnionych zysków</li>
            <li>treści nielegalne, groźby — trwała blokada, zgłoszenie odpowiednim służbom</li>
          </ul>
          <p>
            Od kary można się odwołać, pisząc na adres z punktu 1. Odpowiadamy w ciągu 14 dni.
          </p>
        </Section>

        <Section title="6. Premium i płatności">
          <p>
            Wersja 1 gry nie zawiera żadnych płatności. Zasady dotyczące usługi Premium (w tym
            prawo odstąpienia od umowy) zostaną dodane do regulaminu przed ich wdrożeniem.
          </p>
        </Section>

        <Section title="7. Reklamacje">
          <p>
            Reklamacje dotyczące działania gry przyjmujemy pod adresem z punktu 1. Odpowiadamy w
            ciągu 14 dni.
          </p>
        </Section>

        <Section title="8. Postanowienia końcowe">
          <p>Regulamin podlega prawu polskiemu.</p>
          <p>Ostatnia aktualizacja: 24 października 2026.</p>
        </Section>
      </div>
    </main>
  );
}
