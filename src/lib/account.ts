import "server-only";

import { leaveGuild } from "@/lib/guilds";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const MIN_PASSWORD_LENGTH = 8;

export type ChangePasswordResult = { ok: true } | { error: string };

/** Zmiana hasła wymaga podania obecnego hasła (docs/gdd/13-technika.md: ekran Ustawienia konta). */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
    return { error: `Nowe hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.` };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Nie znaleziono konta." };

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return { error: "Obecne hasło jest nieprawidłowe." };

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { ok: true };
}

export type DeleteAccountResult = { ok: true } | { error: string };

/**
 * Usuwa konto i wszystkie powiązane dane (postać, przedmioty, raporty, zadania…) przez
 * kaskadę w schemacie Prisma. Wymóg prawny: docs/gdd/12-spolecznosc.md „Gra musi mieć
 * przycisk usunięcia konta”.
 */
export async function deleteAccount(userId: string, password: string): Promise<DeleteAccountResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Nie znaleziono konta." };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "Hasło jest nieprawidłowe." };

  // Przywódca gildii musi najpierw oddać przywództwo (albo rozwiązać gildię,
  // gdy jest ostatnim członkiem) – inaczej usunięcie postaci złamałoby
  // ograniczenie klucza obcego Guild.leaderCharacterId.
  const character = await prisma.character.findFirst({ where: { userId } });
  if (character) {
    const membership = await prisma.guildMember.findUnique({ where: { characterId: character.id } });
    if (membership) await leaveGuild(character.id);
  }

  await prisma.user.delete({ where: { id: userId } });

  return { ok: true };
}
