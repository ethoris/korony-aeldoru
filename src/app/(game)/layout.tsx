import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { experienceToNextLevel } from "@/game/character/experience";
import { getCharacterForUser, syncCharacter } from "@/lib/expeditions";

/**
 * Pasek bohatera i nawigacja (docs/gdd/14-wyglad.md, "Interfejs") dla
 * wszystkich ekranów gry. Strona tworzenia bohatera (/character/new) nie ma
 * jeszcze postaci, więc dostaje samą treść, bez paska/menu.
 *
 * GDD chce trzech pasków (PŻ/PD/wytrwałość) w górnym pasku, ale PŻ istnieje
 * tylko w trakcie jednej walki (silnik walki jest bezstanowy między
 * wyprawami, docs/gdd/02-systemy-walki.md) – nie ma go jak pokazać poza
 * wyprawą. Pasek pokazuje więc PD i wytrwałość; PŻ zostaje w raporcie walki.
 */
// Zależy od sesji (przekierowania) – jak w każdej innej chronionej stronie w tym projekcie,
// nie może być statycznym shellem Cache Components (przekierowanie trafiałoby w "postponed" dziurę).
export const instant = false;

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const existing = await getCharacterForUser(session.user.id);
  if (!existing) return <>{children}</>;

  const { character } = await syncCharacter(existing.id);
  const isStaff = session.user.role === "ADMIN" || session.user.role === "MODERATOR";

  return (
    <AppShell
      character={{
        name: character.name,
        level: character.level,
        experience: character.experience,
        nextLevelXp: experienceToNextLevel(character.level),
        stamina: character.stamina,
        staminaUpdatedAt: character.staminaUpdatedAt.toISOString(),
      }}
      isStaff={isStaff}
    >
      {children}
    </AppShell>
  );
}
