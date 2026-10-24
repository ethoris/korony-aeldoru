import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getCharacterForUser } from "@/lib/expeditions";
import { getGuildForCharacter, listGuilds } from "@/lib/guilds";

import { GuildClient } from "./GuildClient";

export const instant = false;

export default async function GuildPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const character = await getCharacterForUser(session.user.id);
  if (!character) redirect("/character/new");

  const myGuild = await getGuildForCharacter(character.id);
  const guilds = myGuild ? [] : await listGuilds(character.server);

  return (
    <main className="flex flex-1 justify-center p-4">
      <GuildClient
        characterId={character.id}
        goldPouch={character.goldPouch}
        myGuild={
          myGuild
            ? {
                ...myGuild,
                members: myGuild.members.map((m) => ({ ...m, joinedAt: m.joinedAt.toISOString() })),
              }
            : null
        }
        guilds={guilds}
      />
    </main>
  );
}
