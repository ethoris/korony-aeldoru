import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { UNIT_KEYS } from "@/game/data/units";
import type { UnitKey } from "@/game/data/units";
import { getCharacterForUser } from "@/lib/expeditions";
import { trainUnits } from "@/lib/fortress";

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
  const unitKey = typeof body?.unitKey === "string" ? body.unitKey : "";
  const quantity = typeof body?.quantity === "number" ? body.quantity : 0;
  if (!UNIT_KEYS.includes(unitKey as UnitKey)) {
    return NextResponse.json({ error: "Nieznana jednostka." }, { status: 400 });
  }

  const result = await trainUnits(character.id, unitKey as UnitKey, quantity);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
