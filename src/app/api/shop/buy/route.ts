import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getCharacterForUser } from "@/lib/expeditions";
import { buyPotion } from "@/lib/shop";

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
  const potionKey = typeof body?.potionKey === "string" ? body.potionKey : "";
  const quantity = typeof body?.quantity === "number" ? body.quantity : 1;

  const result = await buyPotion(character.id, potionKey, quantity);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
