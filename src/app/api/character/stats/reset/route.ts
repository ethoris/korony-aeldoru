import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { totalFreePointsEarned } from "@/game/character/experience";
import { paidResetCost, resetKindFor } from "@/game/character/statReset";
import { baseStatsForRace } from "@/game/data/races";
import { prisma } from "@/lib/prisma";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const WINDOW_30D_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  }

  const character = await prisma.character.findUnique({
    where: { userId_server: { userId: session.user.id, server: "Valmor" } },
  });
  if (!character) {
    return NextResponse.json({ error: "Nie masz jeszcze bohatera." }, { status: 404 });
  }

  const kind = resetKindFor(character.level, character.usedFreeResetAfter20);
  const now = new Date();
  let cost = 0;

  if (kind === "PAID") {
    const lastPaid = await prisma.statResetEvent.findFirst({
      where: { characterId: character.id, paid: true },
      orderBy: { createdAt: "desc" },
    });
    if (lastPaid && now.getTime() - lastPaid.createdAt.getTime() < COOLDOWN_MS) {
      return NextResponse.json({ error: "Reset dostępny raz na 24 h." }, { status: 429 });
    }

    const paidInLast30Days = await prisma.statResetEvent.count({
      where: { characterId: character.id, paid: true, createdAt: { gte: new Date(now.getTime() - WINDOW_30D_MS) } },
    });

    cost = paidResetCost(character.level, paidInLast30Days);
    if (character.goldPouch < cost) {
      return NextResponse.json({ error: `Potrzebujesz ${cost} złota, masz ${character.goldPouch}.` }, { status: 400 });
    }
  }

  const baseStats = baseStatsForRace(character.race);
  const freePoints = totalFreePointsEarned(character.level, character.race);
  const newGoldPouch = character.goldPouch - cost;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.character.update({
      where: { id: character.id },
      data: {
        ...baseStats,
        freePoints,
        goldPouch: newGoldPouch,
        usedFreeResetAfter20: kind === "FREE_FIRST_AFTER_20" ? true : character.usedFreeResetAfter20,
      },
    });

    await tx.statResetEvent.create({
      data: { characterId: character.id, paid: kind === "PAID", goldCost: cost },
    });

    if (cost > 0) {
      await tx.goldEvent.create({
        data: {
          characterId: character.id,
          amount: -cost,
          balanceAfter: newGoldPouch,
          reason: "reset statystyk",
        },
      });
    }

    return result;
  });

  return NextResponse.json({
    ok: true,
    kind,
    cost,
    strength: updated.strength,
    dexterity: updated.dexterity,
    vitality: updated.vitality,
    intellect: updated.intellect,
    freePoints: updated.freePoints,
    goldPouch: updated.goldPouch,
  });
}
