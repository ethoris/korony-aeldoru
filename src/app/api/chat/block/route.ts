import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { blockPlayer, unblockPlayer } from "@/lib/chat";
import { getCharacterForUser } from "@/lib/expeditions";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  const character = await getCharacterForUser(session.user.id);
  if (!character) return NextResponse.json({ error: "Nie masz jeszcze bohatera." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const targetCharacterId = typeof body?.targetCharacterId === "string" ? body.targetCharacterId : "";
  const action = body?.action === "unblock" ? "unblock" : "block";
  if (!targetCharacterId) return NextResponse.json({ error: "Nieprawidłowy cel." }, { status: 400 });

  const result = action === "block" ? await blockPlayer(character.id, targetCharacterId) : await unblockPlayer(character.id, targetCharacterId);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
