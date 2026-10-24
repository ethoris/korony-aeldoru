# Polecenie startowe dla Claude Code

Skopiuj tekst poniżej (od linii „Przeczytaj…”) i wklej do Claude Code w VS Code, w tym folderze.

---

Przeczytaj CLAUDE.md i wszystkie pliki w docs/gdd/. Potem zrealizuj kroki 1 i 2 z sekcji „Kolejność budowy” w docs/gdd/13-technika.md oraz podłączenie bazy Neon:

1. Załóż projekt Next.js (App Router, TypeScript strict, Tailwind, ESLint) w tym folderze, bez nadpisywania CLAUDE.md, START.md i docs/. Zainicjuj Git, dodaj .gitignore (w tym .env*), zrób pierwszy commit.

2. Podłącz Neon:
   - `npm i -g neon@latest` (jeśli się nie uda, używaj `npx neon@latest` zamiast `neon`). Jeśli polecenie otworzy logowanie w przeglądarce, powiedz mi, żebym je dokończył; jeśli to się nie uda, poproś mnie o uruchomienie `neon login` i spróbuj ponownie.
   - W katalogu projektu: `neon init -y --org-id org-sparkling-heart-24215095 --project-id sweet-lake-05538895 --branch production --services postgres`
   - `neon deploy` (utworzy usługi z neon.ts i zapisze zmienne do .env.local).
   - Podłącz bazę przez Prisma, korzystając z zainstalowanych skilli Neon (wybór sterownika pod Next.js na Vercel). Utwórz schemat tabel wersji 1 z docs/gdd/13-technika.md i pierwszą migrację.
   - Dodaj stronę testową /api/health, która wykonuje zapytanie do bazy i zwraca wynik.

3. Zbuduj silnik walki (krok 2) jako czysty moduł src/game/combat/ ze wzorami z docs/gdd/02-systemy-walki.md, potworami z docs/gdd/04-bestiariusz.md i tekstami z docs/gdd/03-teksty-raportow.md. Napisz testy Vitest, w tym symulację 300 walk na klasę dla poziomów 10, 30, 50, 80, 120 i porównaj wyniki z tabelą w docs/gdd/15-balans.md.

4. Sprawdź, że wszystko działa: `npm run build` przechodzi, `npm test` przechodzi, aplikacja startuje (`npm run dev`), a /api/health potwierdza połączenie z bazą.

5. Na koniec napisz po polsku: co powstało, jak mam to sprawdzić u siebie (dokładne komendy dla PowerShell), wyniki testów i symulacji, oraz co się nie udało.
