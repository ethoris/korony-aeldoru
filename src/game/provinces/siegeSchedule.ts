/**
 * Harmonogram oblężeń (docs/gdd/09-twierdza-i-wojna.md): ogłoszenie min. 12h
 * przed bitwą, bitwa w oknie 18:00–22:00 czasu serwera (liczymy UTC, jak
 * reset dobowy w src/game/data/dailyReset.ts).
 */
export const SIEGE_ANNOUNCE_HOURS = 12;
export const BATTLE_WINDOW_START_HOUR_UTC = 18;

/** Najbliższy termin bitwy (18:00 UTC) co najmniej `SIEGE_ANNOUNCE_HOURS` po ogłoszeniu. */
export function nextBattleSlot(announcedAt: Date): Date {
  const earliest = new Date(announcedAt.getTime() + SIEGE_ANNOUNCE_HOURS * 60 * 60 * 1000);
  const slot = new Date(
    Date.UTC(earliest.getUTCFullYear(), earliest.getUTCMonth(), earliest.getUTCDate(), BATTLE_WINDOW_START_HOUR_UTC, 0, 0, 0),
  );
  if (slot < earliest) {
    slot.setUTCDate(slot.getUTCDate() + 1);
  }
  return slot;
}
