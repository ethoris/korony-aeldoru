import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CHAT_UNLOCK_LEVEL, listBlocked, listMessages } from "@/lib/chat";
import { getCharacterForUser } from "@/lib/expeditions";
import { getGuildForCharacter } from "@/lib/guilds";

import { ChatClient } from "./ChatClient";

export const instant = false;

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const character = await getCharacterForUser(session.user.id);
  if (!character) redirect("/character/new");

  const guild = await getGuildForCharacter(character.id);
  const general = character.level >= CHAT_UNLOCK_LEVEL ? await listMessages(character.id, "GENERAL") : [];
  const blocked = await listBlocked(character.id);

  return (
    <main className="flex flex-1 justify-center p-4">
      <ChatClient
        characterId={character.id}
        characterLevel={character.level}
        unlockLevel={CHAT_UNLOCK_LEVEL}
        hasGuild={guild !== null}
        guildId={guild?.id ?? null}
        initialGeneral={general.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
        blocked={blocked}
      />
    </main>
  );
}
