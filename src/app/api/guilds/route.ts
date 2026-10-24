import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createGuild, getGuildForCharacter, listGuilds } from "@/lib/guilds";
import { getCharacterForUser } from "@/lib/expeditions";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  }
  const character = await getCharacterForUser(session.user.id);
  if (!character) {
    return NextResponse.json({ error: "Nie masz jeszcze bohatera." }, { status: 404 });
  }

  const myGuild = await getGuildForCharacter(character.id);
  const guilds = myGuild ? [] : await listGuilds(character.server);
  return NextResponse.json({ myGuild, guilds });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  }
  const character = await getCharacterForUser(session.user.id);
  if (!character) {
    return NextResponse.json({ error: "Nie masz jeszcze bohatera." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  const tag = typeof body?.tag === "string" ? body.tag : "";

  const result = await createGuild(character.id, name, tag);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
