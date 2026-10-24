import { NextResponse } from "next/server";

import { auth } from "@/auth";
import type { Element } from "@/game/combat/types";
import { RUNE_ELEMENTS } from "@/game/items/upgrade";
import { getCharacterForUser } from "@/lib/expeditions";
import { applyRune } from "@/lib/forge";

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
  const itemId = typeof body?.itemId === "string" ? body.itemId : "";
  const element = typeof body?.element === "string" ? (body.element as Element) : null;
  if (!itemId || !element || !RUNE_ELEMENTS.includes(element)) {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const result = await applyRune(character.id, itemId, element);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
