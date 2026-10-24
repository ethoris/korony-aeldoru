import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getCharacterForUser } from "@/lib/expeditions";
import { PVP_UNLOCK_LEVEL, listOpponents } from "@/lib/pvp";

import { PvpClient } from "./PvpClient";

export const instant = false;

export default async function PvpPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const character = await getCharacterForUser(session.user.id);
  if (!character) redirect("/character/new");

  const opponents = character.level >= PVP_UNLOCK_LEVEL ? await listOpponents(character.id) : [];

  return (
    <main className="flex flex-1 justify-center p-4">
      <PvpClient
        characterLevel={character.level}
        unlockLevel={PVP_UNLOCK_LEVEL}
        fame={character.fame}
        opponents={opponents}
      />
    </main>
  );
}
