import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getCharacterForUser, syncCharacter } from "@/lib/expeditions";

import { CharacterStatsPanel } from "./CharacterStatsPanel";

// Cała strona zależy od sesji (przekierowania) i rozlicza wyprawy przy
// wejściu, więc nie da się jej prerenderować jako statyczny shell.
export const instant = false;

export default async function CharacterPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const existing = await getCharacterForUser(session.user.id);
  if (!existing) redirect("/character/new");

  const { character } = await syncCharacter(existing.id);

  return (
    <main className="flex flex-1 justify-center p-4">
      <CharacterStatsPanel
        character={{
          name: character.name,
          race: character.race,
          class: character.class,
          deity: character.deity,
          level: character.level,
          experience: character.experience,
          strength: character.strength,
          dexterity: character.dexterity,
          vitality: character.vitality,
          intellect: character.intellect,
          freePoints: character.freePoints,
          goldPouch: character.goldPouch,
          fame: character.fame,
          usedFreeResetAfter20: character.usedFreeResetAfter20,
        }}
      />
    </main>
  );
}
