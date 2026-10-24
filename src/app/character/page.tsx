import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { CharacterStatsPanel } from "./CharacterStatsPanel";

// Cała strona zależy od sesji (przekierowania), więc nie da się jej
// prerenderować jako statyczny shell – blokujemy ją w całości po stronie serwera.
export const instant = false;

export default async function CharacterPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const character = await prisma.character.findUnique({
    where: { userId_server: { userId: session.user.id, server: "Valmor" } },
    select: {
      name: true,
      race: true,
      class: true,
      deity: true,
      level: true,
      experience: true,
      strength: true,
      dexterity: true,
      vitality: true,
      intellect: true,
      freePoints: true,
      goldPouch: true,
      fame: true,
      usedFreeResetAfter20: true,
    },
  });
  if (!character) redirect("/character/new");

  return (
    <main className="flex flex-1 justify-center p-4">
      <CharacterStatsPanel character={character} />
    </main>
  );
}
