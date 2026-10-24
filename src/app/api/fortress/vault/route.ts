import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getCharacterForUser } from "@/lib/expeditions";
import { transferGoldFromVault, transferGoldToVault } from "@/lib/fortress";

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
  const direction = body?.direction === "deposit" || body?.direction === "withdraw" ? body.direction : null;
  const amount = typeof body?.amount === "number" ? Math.round(body.amount) : NaN;
  if (!direction) {
    return NextResponse.json({ error: "Nieprawidłowy kierunek." }, { status: 400 });
  }

  const result =
    direction === "deposit"
      ? await transferGoldToVault(character.id, amount)
      : await transferGoldFromVault(character.id, amount);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
