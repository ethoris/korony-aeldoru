import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getCharacterForUser } from "@/lib/expeditions";
import { attackPlayer } from "@/lib/pvp";

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
  const defenderId = typeof body?.defenderId === "string" ? body.defenderId : "";
  if (!defenderId) return NextResponse.json({ error: "Nieprawidłowy przeciwnik." }, { status: 400 });

  const result = await attackPlayer(character.id, defenderId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
