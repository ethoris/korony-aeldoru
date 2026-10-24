import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { renameGuild } from "@/lib/guilds";
import { getCharacterForUser } from "@/lib/expeditions";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  const character = await getCharacterForUser(session.user.id);
  if (!character) return NextResponse.json({ error: "Nie masz jeszcze bohatera." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  if (!name) return NextResponse.json({ error: "Podaj nową nazwę." }, { status: 400 });

  const result = await renameGuild(character.id, name);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
