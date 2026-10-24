import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { applySanction } from "@/lib/chat";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const characterId = typeof body?.characterId === "string" ? body.characterId : "";
  const type = body?.type;
  const reason = typeof body?.reason === "string" ? body.reason : "";
  const durationHours = typeof body?.durationHours === "number" ? body.durationHours : null;
  if (!characterId || !["MUTE", "TRADE_BAN", "ACCOUNT_BAN"].includes(type)) {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const result = await applySanction(session.user.id, characterId, type, reason, durationHours);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 403 });
  return NextResponse.json(result);
}
