/** Nowi gracze mają 7 dni ochrony przed atakami innych graczy (docs/gdd/12-spolecznosc.md, samouczek). */
export const NEW_PLAYER_PROTECTION_DAYS = 7;

export function isNewPlayerProtected(createdAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - createdAt.getTime() < NEW_PLAYER_PROTECTION_DAYS * 24 * 60 * 60 * 1000;
}

export function protectionEndsAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + NEW_PLAYER_PROTECTION_DAYS * 24 * 60 * 60 * 1000);
}
