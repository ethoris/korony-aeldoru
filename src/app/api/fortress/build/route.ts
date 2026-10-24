import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { BUILDING_KEYS } from "@/game/data/buildings";
import type { BuildingKey } from "@/game/data/buildings";
import { getCharacterForUser } from "@/lib/expeditions";
import { startBuild } from "@/lib/fortress";

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
  const building = typeof body?.building === "string" ? body.building : "";
  if (!BUILDING_KEYS.includes(building as BuildingKey)) {
    return NextResponse.json({ error: "Nieznany budynek." }, { status: 400 });
  }

  const result = await startBuild(character.id, building as BuildingKey);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
