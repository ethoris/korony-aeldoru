import { NextResponse } from "next/server";

import { auth } from "@/auth";
import type { ResourceKey } from "@/game/data/buildings";
import { createItemOffer, createResourceOffer, listOffers } from "@/lib/market";
import { getCharacterForUser } from "@/lib/expeditions";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  const character = await getCharacterForUser(session.user.id);
  if (!character) return NextResponse.json({ error: "Nie masz jeszcze bohatera." }, { status: 404 });

  const offers = await listOffers(character.server);
  return NextResponse.json({ offers });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  const character = await getCharacterForUser(session.user.id);
  if (!character) return NextResponse.json({ error: "Nie masz jeszcze bohatera." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const price = typeof body?.price === "number" ? body.price : NaN;
  const itemId = typeof body?.itemId === "string" ? body.itemId : null;
  const resourceKey = typeof body?.resourceKey === "string" ? (body.resourceKey as ResourceKey) : null;
  const quantity = typeof body?.quantity === "number" ? body.quantity : 1;

  const result = itemId
    ? await createItemOffer(character.id, itemId, price)
    : resourceKey
      ? await createResourceOffer(character.id, resourceKey, quantity, price)
      : { error: "Podaj przedmiot albo surowiec." };

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
