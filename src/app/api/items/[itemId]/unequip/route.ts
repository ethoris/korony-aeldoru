import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getCharacterForUser } from "@/lib/expeditions";
import { unequipItem } from "@/lib/inventory";

export async function POST(_request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  }

  const character = await getCharacterForUser(session.user.id);
  if (!character) {
    return NextResponse.json({ error: "Nie masz jeszcze bohatera." }, { status: 404 });
  }

  const { itemId } = await params;
  const result = await unequipItem(character.id, itemId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
