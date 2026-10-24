import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { UNIT_KEYS } from "@/game/data/units";
import type { UnitKey } from "@/game/data/units";
import { getCharacterForUser } from "@/lib/expeditions";
import { listRaidsFor, sendRaid } from "@/lib/raids";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  }

  const character = await getCharacterForUser(session.user.id);
  if (!character) {
    return NextResponse.json({ error: "Nie masz jeszcze bohatera." }, { status: 404 });
  }

  const raids = await listRaidsFor(character.id);
  return NextResponse.json({ raids });
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
  const defenderId = typeof body?.defenderId === "string" ? body.defenderId : "";
  const armyInput = body?.army && typeof body.army === "object" ? body.army : {};
  if (!defenderId) return NextResponse.json({ error: "Nieprawidłowy cel." }, { status: 400 });

  const army: Partial<Record<UnitKey, number>> = {};
  for (const key of UNIT_KEYS) {
    const value = armyInput[key];
    if (typeof value === "number" && value > 0) army[key] = Math.round(value);
  }

  const result = await sendRaid(character.id, defenderId, army);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
