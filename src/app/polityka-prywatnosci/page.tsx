import Link from "next/link";

export const metadata = { title: "Polityka prywatności — Korony Aeldoru" };

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

export default function PolitykaPrywatnosciPage() {
  return (
    <main className="flex flex-1 justify-center p-4">
      <div className="flex w-full max-w-2xl flex-col gap-6 pb-12">
        <div className="rounded-lg border border-line bg-card p-6">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">
            Polityka prywatności
          </h1>
          <p className="mt-2 text-sm text-muted">
            Wersja robocza na czas testów zamkniętych wersji 1. To nie jest porada prawna — przed
            publicznym startem zostanie sprawdzona przez prawnika.
          </p>
        </div>

        <Section title="1. Administrator danych">
          <p>
            Administratorem danych jest Patryk, kontakt:{" "}
            <a className="text-accent underline" href="mailto:pat2382@gmail.com">
              pat2382@gmail.com
            </a>
            . Gra jest obecnie projektem testowym, nie zarejestrowaną działalnością gospodarczą.
          </p>
        </Section>

        <Section title="2. Jakie dane zbieramy">
          <ul className="list-disc pl-5">
            <li>adres e-mail — do logowania i kontaktu w sprawie konta</li>
            <li>hasło — przechowywane w postaci zaszyfrowanej (scrypt), nie znamy jego treści</li>
            <li>potwierdzenie ukończenia 16 lat</li>
            <li>
              dane rozgrywki: postać, statystyki, złoto, przedmioty, wyprawy, raporty walk, zadania
              — potrzebne do działania gry
            </li>
            <li>
              zdarzenia gry (np. rejestracja, awans, ukończone zadanie) — wyłącznie do poprawy
              balansu i naprawy błędów, we własnej bazie
            </li>
          </ul>
        </Section>

        <Section title="3. Czego nie zbieramy">
          <p>
            Nie używamy żadnej zewnętrznej analityki i żadnych cookies śledzących ani
            marketingowych. Obecnie nie zapisujemy adresu IP ani identyfikatora przeglądarki.
          </p>
          <p>
            Przy wdrożeniu czatu i handlu (wersja 4) zaczniemy przechowywać adres IP i
            identyfikator przeglądarki maks. 90 dni, wyłącznie do ochrony gry przed multikontami i
            botami — ta polityka zostanie wtedy zaktualizowana, zanim to nastąpi.
          </p>
        </Section>

        <Section title="4. Cel i podstawa przetwarzania">
          <ul className="list-disc pl-5">
            <li>świadczenie usługi gry — wykonanie umowy (założenie i prowadzenie konta)</li>
            <li>potwierdzenie wieku 16+ — wymóg zgody na przetwarzanie danych przez tę usługę</li>
            <li>
              ochrona gry przed oszustwami i poprawa balansu — uzasadniony interes administratora
            </li>
          </ul>
        </Section>

        <Section title="5. Cookies">
          <p>
            Używamy wyłącznie technicznego cookie sesji logowania, niezbędnego do działania gry —
            nie wymaga on zgody. Nie ma cookies analitycznych ani reklamowych.
          </p>
        </Section>

        <Section title="6. Komu przekazujemy dane">
          <p>
            Dane przetwarzają podmioty hostujące grę: Vercel (hosting aplikacji) i Neon (baza
            danych PostgreSQL), wyłącznie w zakresie potrzebnym do działania usługi.
          </p>
        </Section>

        <Section title="7. Czas przechowywania">
          <p>Dane konta przechowujemy do jego usunięcia przez użytkownika.</p>
          <p>
            Usunięte konto może pozostać w kopiach zapasowych bazy do końca okresu ich
            przechowywania (maks. 12 miesięcy). Jeśli po przywróceniu starej kopii okaże się, że
            jakieś konto zostało w międzyczasie usunięte, usuwamy je ponownie.
          </p>
        </Section>

        <Section title="8. Twoje prawa">
          <p>Masz prawo do: dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia
            przetwarzania, przenoszenia danych oraz wniesienia skargi do Prezesa Urzędu Ochrony
            Danych Osobowych.</p>
          <p>
            Konto i wszystkie powiązane dane możesz usunąć samodzielnie w{" "}
            <Link href="/konto" className="text-accent underline">ustawieniach konta</Link>, albo
            pisząc na adres z punktu 1.
          </p>
        </Section>

        <Section title="9. Zmiany polityki">
          <p>O istotnych zmianach tej polityki poinformujemy w grze.</p>
          <p>Ostatnia aktualizacja: 24 października 2026.</p>
        </Section>
      </div>
    </main>
  );
}
