import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { leaveGuild } from "@/lib/guilds";
import { getCharacterForUser } from "@/lib/expeditions";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  const character = await getCharacterForUser(session.user.id);
  if (!character) return NextResponse.json({ error: "Nie masz jeszcze bohatera." }, { status: 404 });

  const result = await leaveGuild(character.id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
