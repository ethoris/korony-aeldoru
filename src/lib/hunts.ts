import "server-only";

import { experienceToNextLevel } from "@/game/character/experience";
import { dayKeyFor } from "@/game/data/dailyReset";
import { generateHunts } from "@/game/data/hunts";
import { combatPotionKeys } from "@/game/data/potions";

import type { Prisma } from "@/generated/prisma/client";

export interface HuntRewardSummary {
  questKey: string;
  xpBonus: number;
  goldBonus: number;
  potionKey: string;
}

/**
 * Aktualizuje postęp dzisiejszych łowów tej lokacji i przyznaje nagrody za
 * nowo ukończone sloty. Wywoływane w tej samej transakcji co
 * resolveExpedition (docs/gdd/06-zadania.md, "Łowy").
 */
export async function progressLocationHunts(
  tx: Prisma.TransactionClient,
  params: { characterId: string; characterLevel: number; locationKey: string; winCount: number; now: Date },
): Promise<HuntRewardSummary[]> {
  if (params.winCount <= 0) return [];

  const dayKey = dayKeyFor(params.now);
  const slots = generateHunts(params.locationKey, dayKey);
  const fullLevelXp = experienceToNextLevel(params.characterLevel);
  const potionKeys = combatPotionKeys();
  const rewards: HuntRewardSummary[] = [];

  for (const slot of slots) {
    const existing = await tx.questProgress.findUnique({
      where: { characterId_questKey: { characterId: params.characterId, questKey: slot.key } },
    });
    if (existing?.state === "COMPLETED") continue;

    const counter = (existing?.counter ?? 0) + params.winCount;

    if (counter < slot.target) {
      await tx.questProgress.upsert({
        where: { characterId_questKey: { characterId: params.characterId, questKey: slot.key } },
        create: { characterId: params.characterId, questKey: slot.key, state: "ACTIVE", counter },
        update: { counter },
      });
      continue;
    }

    await tx.questProgress.upsert({
      where: { characterId_questKey: { characterId: params.characterId, questKey: slot.key } },
      create: { characterId: params.characterId, questKey: slot.key, state: "COMPLETED", counter },
      update: { state: "COMPLETED", counter },
    });

    const xpBonus = Math.round(fullLevelXp * 0.03);
    const goldBonus = 10 * params.characterLevel;
    const potionKey = potionKeys[Math.floor(Math.random() * potionKeys.length)];

    await tx.consumable.upsert({
      where: { characterId_kind: { characterId: params.characterId, kind: potionKey } },
      create: { characterId: params.characterId, kind: potionKey, quantity: 1 },
      update: { quantity: { increment: 1 } },
    });

    await tx.gameEvent.create({
      data: {
        characterId: params.characterId,
        type: "łowy ukończone",
        details: { quest: slot.key, xp: xpBonus, gold: goldBonus, potion: potionKey },
      },
    });

    rewards.push({ questKey: slot.key, xpBonus, goldBonus, potionKey });
  }

  return rewards;
}

export function huntSlotsForLocation(locationKey: string, now: Date) {
  return generateHunts(locationKey, dayKeyFor(now));
}
