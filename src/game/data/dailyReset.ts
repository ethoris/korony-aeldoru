/**
 * Dzień gry dla rzeczy odnawianych co dobę (łowy, zadania dzienne,
 * docs/gdd/06-zadania.md i docs/gdd/11-gospodarka-i-zadania.md: reset o 6:00).
 * Uproszczenie: liczymy 6:00 UTC, nie czasu lokalnego gracza.
 */
const RESET_HOUR_UTC = 6;

export function dayKeyFor(date: Date): string {
  const shifted = new Date(date.getTime() - RESET_HOUR_UTC * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}
