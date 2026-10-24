import "server-only";

import type { ClassKey } from "@/game/combat/types";
import { dayKeyFor } from "@/game/data/dailyReset";
import { dailyCompletionKey, generateDailyQuests } from "@/game/data/dailyQuests";
import { EXPEDITION_KINDS } from "@/game/data/expeditionKinds";
import { generateLoot } from "@/game/items/generateItem";

import type { Prisma } from "@/generated/prisma/client";

export interface DailyQuestDelta {
  expeditions: number;
  wins: number;
  bossWin: boolean;
  goldEarned: number;
  lootFound: boolean;
}

export interface DailyRewardSummary {
  staminaBonus: number;
  itemName: string | null;
  streakDay: number | null;
  legendaryBonusItemName: string | null;
}

/**
 * Aktualizuje postęp dzisiejszych 3 zadań dziennych i przyznaje nagrodę,
 * gdy wszystkie trzy są ukończone tego samego dnia pierwszy raz
 * (docs/gdd/11-gospodarka-i-zadania.md, "Zadania dzienne").
 */
export async function progressDailyQuests(
  tx: Prisma.TransactionClient,
  params: { characterId: string; characterLevel: number; characterClass: ClassKey; now: Date; delta: DailyQuestDelta },
): Promise<DailyRewardSummary | null> {
  const dayKey = dayKeyFor(params.now);
  const completionKey = dailyCompletionKey(dayKey);

  const alreadyComplete = await tx.questProgress.findUnique({
    where: { characterId_questKey: { characterId: params.characterId, questKey: completionKey } },
  });
  if (alreadyComplete?.state === "COMPLETED") return null; // nagroda już odebrana dziś

  const slots = generateDailyQuests(params.characterId, dayKey);
  let allDone = true;

  for (const slot of slots) {
    const existing = await tx.questProgress.findUnique({
      where: { characterId_questKey: { characterId: params.characterId, questKey: slot.key } },
    });
    if (existing?.state === "COMPLETED") continue;

    const increment =
      slot.type === "EXPEDITIONS_COUNT"
        ? params.delta.expeditions
        : slot.type === "WINS_COUNT"
          ? params.delta.wins
          : slot.type === "GOLD_EARNED"
            ? Math.max(0, params.delta.goldEarned)
            : slot.type === "BOSS_WIN"
              ? (params.delta.bossWin ? 1 : 0)
              : params.delta.lootFound
                ? 1
                : 0;

    const counter = (existing?.counter ?? 0) + increment;
    const done = counter >= slot.target;
    if (!done) allDone = false;

    await tx.questProgress.upsert({
      where: { characterId_questKey: { characterId: params.characterId, questKey: slot.key } },
      create: { characterId: params.characterId, questKey: slot.key, state: done ? "COMPLETED" : "ACTIVE", counter },
      update: { state: done ? "COMPLETED" : "ACTIVE", counter },
    });
  }

  if (!allDone) return null;

  const yesterdayKey = dayKeyFor(new Date(params.now.getTime() - 24 * 60 * 60 * 1000));
  const yesterdayCompletion = await tx.questProgress.findUnique({
    where: { characterId_questKey: { characterId: params.characterId, questKey: dailyCompletionKey(yesterdayKey) } },
  });
  const streakDay = yesterdayCompletion?.state === "COMPLETED" ? yesterdayCompletion.counter + 1 : 1;

  await tx.questProgress.upsert({
    where: { characterId_questKey: { characterId: params.characterId, questKey: completionKey } },
    create: { characterId: params.characterId, questKey: completionKey, state: "COMPLETED", counter: streakDay },
    update: { state: "COMPLETED", counter: streakDay },
  });

  const item = generateLoot({
    rng: Math.random,
    monsterLevel: params.characterLevel,
    playerClass: params.characterClass,
    kind: EXPEDITION_KINDS.HUNT,
    guaranteedMinQuality: "MAGIC",
    forceItem: true,
  });
  if (item) {
    const created = await tx.item.create({
      data: {
        characterId: params.characterId,
        name: item.name,
        slot: item.slot,
        level: item.level,
        quality: item.quality,
        forClass: item.forClass,
        damageMin: item.damageMin,
        damageMax: item.damageMax,
        armor: item.armor,
        traits: JSON.parse(JSON.stringify(item.affixes)),
      },
    });
    await tx.itemEvent.create({
      data: { itemId: created.id, characterId: params.characterId, type: "CREATED", reason: "zadania dzienne: komplet" },
    });
  }

  let legendaryBonusItemName: string | null = null;
  const isStreakBonusDay = streakDay > 0 && streakDay % 7 === 0;
  if (isStreakBonusDay) {
    const legendaryItem = generateLoot({
      rng: Math.random,
      monsterLevel: params.characterLevel,
      playerClass: params.characterClass,
      kind: EXPEDITION_KINDS.HUNT,
      guaranteedMinQuality: Math.random() < 0.1 ? "LEGENDARY" : "RARE",
      forceItem: true,
    });
    if (legendaryItem) {
      const created = await tx.item.create({
        data: {
          characterId: params.characterId,
          name: legendaryItem.name,
          slot: legendaryItem.slot,
          level: legendaryItem.level,
          quality: legendaryItem.quality,
          forClass: legendaryItem.forClass,
          damageMin: legendaryItem.damageMin,
          damageMax: legendaryItem.damageMax,
          armor: legendaryItem.armor,
          traits: JSON.parse(JSON.stringify(legendaryItem.affixes)),
        },
      });
      await tx.itemEvent.create({
        data: { itemId: created.id, characterId: params.characterId, type: "CREATED", reason: "zadania dzienne: seria 7 dni" },
      });
      legendaryBonusItemName = legendaryItem.name;
    }
  }

  await tx.gameEvent.create({
    data: {
      characterId: params.characterId,
      type: "zadania dzienne: komplet",
      details: { streakDay, item: item?.name ?? null, legendaryBonusItemName },
    },
  });

  return {
    staminaBonus: 20,
    itemName: item?.name ?? null,
    streakDay,
    legendaryBonusItemName,
  };
}

export function dailyQuestSlotsFor(characterId: string, now: Date) {
  return generateDailyQuests(characterId, dayKeyFor(now));
}
