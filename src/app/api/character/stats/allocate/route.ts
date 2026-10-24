import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const STAT_KEYS = ["strength", "dexterity", "vitality", "intellect"] as const;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const deltas: Record<string, number> = {};
  let total = 0;

  for (const key of STAT_KEYS) {
    const value = (body as Record<string, unknown>)[key];
    const amount = typeof value === "number" && Number.isInteger(value) ? value : 0;
    if (amount < 0) {
      return NextResponse.json({ error: "Punkty nie mogą być ujemne." }, { status: 400 });
    }
    deltas[key] = amount;
    total += amount;
  }

  if (total <= 0) {
    return NextResponse.json({ error: "Nie wybrano żadnych punktów do rozdania." }, { status: 400 });
  }

  const character = await prisma.character.findUnique({
    where: { userId_server: { userId: session.user.id, server: "Valmor" } },
  });
  if (!character) {
    return NextResponse.json({ error: "Nie masz jeszcze bohatera." }, { status: 404 });
  }

  if (total > character.freePoints) {
    return NextResponse.json({ error: "Nie masz tylu wolnych punktów." }, { status: 400 });
  }

  const updated = await prisma.character.update({
    where: { id: character.id },
    data: {
      strength: character.strength + deltas.strength,
      dexterity: character.dexterity + deltas.dexterity,
      vitality: character.vitality + deltas.vitality,
      intellect: character.intellect + deltas.intellect,
      freePoints: character.freePoints - total,
    },
  });

  return NextResponse.json({
    ok: true,
    strength: updated.strength,
    dexterity: updated.dexterity,
    vitality: updated.vitality,
    intellect: updated.intellect,
    freePoints: updated.freePoints,
  });
}
