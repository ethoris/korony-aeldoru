/** Sława i system Elo (docs/gdd/02-systemy-walki.md). Każdy zaczyna z 1000 sławy. */
export const STARTING_FAME = 1000;

export function expectedScore(selfFame: number, opponentFame: number): number {
  return 1 / (1 + Math.pow(10, (opponentFame - selfFame) / 400));
}

/** ΔS = 32 · (wynik − E); wynik = 1 za wygraną, 0 za przegraną. Zero-sum: strona przegrana dostaje -ΔS drugiej. */
export function fameDelta(selfFame: number, opponentFame: number, won: boolean): number {
  const e = expectedScore(selfFame, opponentFame);
  return Math.round(32 * ((won ? 1 : 0) - e));
}

export type PvpRank = "Brąz" | "Srebro" | "Złoto" | "Mistrz" | "Legenda";

export function rankForFame(fame: number): PvpRank {
  if (fame >= 1800) return "Legenda";
  if (fame >= 1600) return "Mistrz";
  if (fame >= 1400) return "Złoto";
  if (fame >= 1200) return "Srebro";
  return "Brąz";
}
