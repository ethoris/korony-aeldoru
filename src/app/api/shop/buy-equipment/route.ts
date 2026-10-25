import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getCharacterForUser } from "@/lib/expeditions";
import { buyEquipmentFromNpc } from "@/lib/shop";
import type { ItemSlot } from "@/generated/prisma/client";

const VALID_SLOTS: ItemSlot[] = ["WEAPON", "OFFHAND", "HELMET", "ARMOR", "GLOVES", "BOOTS", "AMULET", "RING"];

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
  const slot = typeof body?.slot === "string" ? (body.slot as ItemSlot) : null;
  if (!slot || !VALID_SLOTS.includes(slot)) {
    return NextResponse.json({ error: "Nieprawidłowy slot." }, { status: 400 });
  }

  const result = await buyEquipmentFromNpc(character.id, slot);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
