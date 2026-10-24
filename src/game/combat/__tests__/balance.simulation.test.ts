import { describe, expect, it } from "vitest";

import { CLASSES } from "@/game/data/classes";
import { getBossByLevel } from "@/game/data/monsters";

import { buildBalanceTestHero } from "../equipment";
import { simulateBattle } from "../simulate";
import type { ClassKey, MonsterConfig } from "../types";

/**
 * Powtórka symulacji balansu z docs/gdd/15-balans.md: 300 walk na klasę i
 * poziom przeciwnika (bossa tego poziomu), bohater z 2 punktami/poziom w
 * statystykę główną i 1 w WYT, magiczny ekwipunek swojego poziomu, bez
 * zdolności/mikstur/zestawów (te dodadzą ok. 15–25% – GDD).
 *
 * WAŻNE: tabela w 15-balans.md powstała z testu BEZ kolumny „Cechy klas po
 * teście” z 02-systemy-walki.md (blok Paladyna, leczenie Kapłana, Mag
 * ignorujący obronę, 2 ataki Łotra, darmowy strzał Łucznika) – GDD mówi to
 * wprost: „Zdolności nie były jeszcze uwzględnione w teście balansu […]
 * sprawdzimy to w drugiej symulacji po zakodowaniu silnika walki.” Ten plik
 * JEST tą drugą symulacją: silnik liczy te cechy, więc różnice względem
 * starej tabeli (patrz log w konsoli) to sygnał balansu dla Patryka, a nie
 * błąd – CLAUDE.md zakazuje samodzielnie zmieniać liczby balansu z GDD.
 */

const LEVELS = [10, 30, 50, 80, 120] as const;
const FIGHTS_PER_CELL = 300;
/** Różnica ponad tyle punktów procentowych trafia do listy "do przeglądu" w logu. */
const REVIEW_THRESHOLD_PP = 20;

const EXPECTED_BOSS_WIN_RATE: Record<ClassKey, Record<number, number>> = {
  WARRIOR: { 10: 43, 30: 28, 50: 34, 80: 51, 120: 50 },
  PALADIN: { 10: 22, 30: 30, 50: 42, 80: 55, 120: 63 },
  ARCHER: { 10: 21, 30: 24, 50: 36, 80: 53, 120: 58 },
  ROGUE: { 10: 26, 30: 27, 50: 43, 80: 58, 120: 71 },
  MAGE: { 10: 38, 30: 24, 50: 34, 80: 44, 120: 54 },
  PRIEST: { 10: 71, 30: 34, 50: 28, 80: 28, 120: 43 },
};

function seedFor(classKey: ClassKey, level: number, i: number): number {
  const classIndex = Object.keys(CLASSES).indexOf(classKey);
  return level * 1_000_000 + classIndex * 10_000 + i + 1;
}

function pickSpellElement(boss: MonsterConfig): "fire" | "ice" | "lightning" {
  const castable = ["fire", "ice", "lightning"] as const;
  const weak = castable.find((el) => boss.weakTo.includes(el));
  return weak ?? "fire";
}

function runBossSimulation(classKey: ClassKey, level: number) {
  const bossDef = getBossByLevel(level);
  const boss: MonsterConfig = {
    key: bossDef.key,
    name: bossDef.name,
    level: bossDef.level,
    type: bossDef.type,
    isBoss: true,
    weakTo: bossDef.weakTo,
    resistTo: bossDef.resistTo,
  };

  const hero = buildBalanceTestHero(classKey, level);
  if (classKey === "MAGE") {
    hero.spellElement = pickSpellElement(boss);
  }

  let wins = 0;
  let turnsOnWin = 0;

  for (let i = 0; i < FIGHTS_PER_CELL; i++) {
    const outcome = simulateBattle(hero, boss, seedFor(classKey, level, i));
    if (outcome.result === "WIN") {
      wins++;
      turnsOnWin += outcome.turnsTaken;
    }
  }

  return {
    winRatePct: (wins / FIGHTS_PER_CELL) * 100,
    avgTurnsOnWin: wins > 0 ? turnsOnWin / wins : null,
  };
}

// Symulacje liczymy raz, przy wczytywaniu pliku testowego, żeby tabela
// porównawcza i poszczególne asercje używały tych samych 300-walkowych prób
// niezależnie od kolejności uruchamiania testów przez Vitest.
const CLASS_KEYS = Object.keys(CLASSES) as ClassKey[];
const RESULTS = CLASS_KEYS.flatMap((classKey) =>
  LEVELS.map((level) => ({
    classKey,
    level,
    expected: EXPECTED_BOSS_WIN_RATE[classKey][level],
    ...runBossSimulation(classKey, level),
  })),
);

function formatComparisonTable(): string {
  const header = "klasa".padEnd(10) + "poz.".padEnd(6) + "symulacja".padEnd(11) + "GDD".padEnd(7) + "różnica".padEnd(9) + "śr. tur (wygrane)";
  const lines = RESULTS.map((r) => {
    const diff = r.winRatePct - r.expected;
    return (
      CLASSES[r.classKey].name.padEnd(10) +
      String(r.level).padEnd(6) +
      `${r.winRatePct.toFixed(1)}%`.padEnd(11) +
      `${r.expected}%`.padEnd(7) +
      `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}pp`.padEnd(9) +
      (r.avgTurnsOnWin !== null ? r.avgTurnsOnWin.toFixed(1) : "—")
    );
  });
  return [header, ...lines].join("\n");
}

describe("symulacja balansu vs. docs/gdd/15-balans.md (300 walk/klasa/poziom)", () => {
  it("wypisuje tabelę porównawczą i listę komórek do przeglądu balansu", () => {
    const toReview = RESULTS.filter((r) => Math.abs(r.winRatePct - r.expected) > REVIEW_THRESHOLD_PP);
    const reviewNote =
      toReview.length === 0
        ? "Wszystkie komórki w granicach ±" + REVIEW_THRESHOLD_PP + "pp od tabeli GDD."
        : "Do przeglądu balansu (różnica > " +
          REVIEW_THRESHOLD_PP +
          "pp, patrz komentarz na początku pliku): " +
          toReview.map((r) => `${CLASSES[r.classKey].name}/poz.${r.level}`).join(", ");

    console.log("\n" + formatComparisonTable() + "\n\n" + reviewNote + "\n");
    expect(RESULTS.length).toBe(CLASS_KEYS.length * LEVELS.length);
  });

  for (const r of RESULTS) {
    const diff = r.winRatePct - r.expected;
    it(`${CLASSES[r.classKey].name} vs boss poz. ${r.level}: ${r.winRatePct.toFixed(1)}% (GDD: ${r.expected}%, ${diff >= 0 ? "+" : ""}${diff.toFixed(1)}pp)`, () => {
      // Jedyna twarda asercja: dokładnie ten błąd, który GDD opisuje jako
      // powód zmiany wzorów – żadna klasa nie wygrywa z bossem swojego
      // poziomu zawsze albo nigdy. Odległość od starej tabeli jest tylko
      // zalogowana (patrz test wyżej) – powody są w komentarzu na początku pliku.
      expect(r.winRatePct).toBeGreaterThan(0);
      expect(r.winRatePct).toBeLessThan(100);
    });
  }
});
