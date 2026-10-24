import { NextResponse } from "next/server";

import { auth } from "@/auth";
import type { ChatChannelKey } from "@/lib/chat";
import { reportPlayer } from "@/lib/chat";
import { getCharacterForUser } from "@/lib/expeditions";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  const character = await getCharacterForUser(session.user.id);
  if (!character) return NextResponse.json({ error: "Nie masz jeszcze bohatera." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const targetCharacterId = typeof body?.targetCharacterId === "string" ? body.targetCharacterId : "";
  const reason = typeof body?.reason === "string" ? body.reason : "";
  const channel = (body?.channel as ChatChannelKey) ?? "GENERAL";
  const withCharacterId = typeof body?.withCharacterId === "string" ? body.withCharacterId : undefined;
  if (!targetCharacterId) return NextResponse.json({ error: "Nieprawidłowy cel." }, { status: 400 });

  const result = await reportPlayer(character.id, targetCharacterId, reason, channel, { withCharacterId });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
