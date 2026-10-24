import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getCharacterForUser } from "@/lib/expeditions";
import { listOpponents } from "@/lib/pvp";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  }

  const character = await getCharacterForUser(session.user.id);
  if (!character) {
    return NextResponse.json({ error: "Nie masz jeszcze bohatera." }, { status: 404 });
  }

  const opponents = await listOpponents(character.id);
  return NextResponse.json({ opponents });
}
