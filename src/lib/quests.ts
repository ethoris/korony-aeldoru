import "server-only";

import { experienceToNextLevel } from "@/game/character/experience";
import type { ExpeditionKind } from "@/game/combat/types";
import { CHAPTER_REWARDS, QUESTS, getQuest, questsForLocation, storyQuestUnlocking } from "@/game/data/quests";
import { generateLoot } from "@/game/items/generateItem";
import { EXPEDITION_KINDS } from "@/game/data/expeditionKinds";

import type { Prisma } from "@/generated/prisma/client";

const UNLOCKED_STATES = new Set(["COMPLETED", "UNLOCKED_NO_REWARD"]);

/** Lokacja jest dostępna, gdy poziom wystarcza i zadanie fabularne poprzedniej lokacji jest zaliczone. */
export async function isLocationUnlocked(
  tx: Prisma.TransactionClient,
  characterId: string,
  locationKey: string,
): Promise<boolean> {
  const prerequisite = storyQuestUnlocking(locationKey);
  if (!prerequisite) return true;

  const progress = await tx.questProgress.findUnique({
    where: { characterId_questKey: { characterId, questKey: prerequisite.key } },
  });
  return progress ? UNLOCKED_STATES.has(progress.state) : false;
}

export interface QuestRewardSummary {
  questKey: string;
  title: string;
  xpBonus: number;
  goldBonus: number;
  staminaBonus: number;
  lootItemName: string | null;
  chapterRewardTitle: string | null;
}

/**
 * Aktualizuje postęp zadań tej lokacji po rozliczeniu wyprawy i przyznaje
 * nagrody za nowo ukończone zadania. Wywoływane w tej samej transakcji co
 * resolveExpedition (docs/gdd/06-zadania.md).
 */
export async function progressLocationQuests(
  tx: Prisma.TransactionClient,
  params: {
    characterId: string;
    characterLevel: number;
    characterClass: Parameters<typeof generateLoot>[0]["playerClass"];
    locationKey: string;
    expeditionKind: ExpeditionKind;
    winCount: number;
    bossKey: string | null;
    bossResult: "WIN" | "LOSE" | "DRAW" | "RETREAT" | null;
  },
): Promise<QuestRewardSummary[]> {
  const rewards: QuestRewardSummary[] = [];
  const quests = questsForLocation(params.locationKey);
  const fullLevelXp = experienceToNextLevel(params.characterLevel);

  for (const quest of quests) {
    const existing = await tx.questProgress.findUnique({
      where: { characterId_questKey: { characterId: params.characterId, questKey: quest.key } },
    });
    if (existing?.state === "COMPLETED") continue;

    let counter = existing?.counter ?? 0;
    let newlyCompletedWithReward = false;
    let newlyUnlockedNoReward = false;

    switch (quest.condition.type) {
      case "WIN_COUNT": {
        counter += params.winCount;
        if (counter >= (quest.condition.target ?? Infinity)) newlyCompletedWithReward = true;
        break;
      }
      case "DEEP_WIN": {
        if (params.expeditionKind === "DEEP" && params.winCount > 0) {
          counter = 1;
          newlyCompletedWithReward = true;
        }
        break;
      }
      case "FIND_ITEM": {
        if (params.winCount > 0 && Math.random() < (quest.condition.chance ?? 0.2)) {
          newlyCompletedWithReward = true;
        }
        break;
      }
      case "BOSS_DEFEAT": {
        if (params.expeditionKind === "BOSS" && params.bossKey === quest.condition.bossKey) {
          if (params.bossResult === "WIN") {
            newlyCompletedWithReward = true;
          } else {
            counter += 1;
            if (counter >= 3 && existing?.state !== "UNLOCKED_NO_REWARD") {
              newlyUnlockedNoReward = true;
            }
          }
        }
        break;
      }
    }

    if (!newlyCompletedWithReward && !newlyUnlockedNoReward) {
      await tx.questProgress.upsert({
        where: { characterId_questKey: { characterId: params.characterId, questKey: quest.key } },
        create: { characterId: params.characterId, questKey: quest.key, state: "ACTIVE", counter },
        update: { counter },
      });
      continue;
    }

    if (newlyUnlockedNoReward) {
      await tx.questProgress.upsert({
        where: { characterId_questKey: { characterId: params.characterId, questKey: quest.key } },
        create: { characterId: params.characterId, questKey: quest.key, state: "UNLOCKED_NO_REWARD", counter },
        update: { state: "UNLOCKED_NO_REWARD", counter },
      });
      continue;
    }

    // newlyCompletedWithReward
    await tx.questProgress.upsert({
      where: { characterId_questKey: { characterId: params.characterId, questKey: quest.key } },
      create: { characterId: params.characterId, questKey: quest.key, state: "COMPLETED", counter },
      update: { state: "COMPLETED", counter },
    });

    const percent = quest.kind === "STORY" ? (quest.isChapterFinale ? 0.5 : 0.2) : 0.08;
    const goldMultiplier = quest.kind === "STORY" ? (quest.isChapterFinale ? 150 : 50) : 20;
    const xpBonus = Math.round(fullLevelXp * percent);
    let goldBonus = goldMultiplier * params.characterLevel;
    let staminaBonus = 0;
    let lootItemName: string | null = null;
    let chapterRewardTitle: string | null = null;

    // Co drugie zadanie fabularne (poza finałem) daje magiczny/rzadki przedmiot dla klasy.
    const grantsStoryItem =
      quest.kind === "STORY" && ((quest.storyOrder ?? 0) % 2 === 0 || quest.isChapterFinale === true);

    if (grantsStoryItem) {
      const item = generateLoot({
        rng: Math.random,
        monsterLevel: params.characterLevel,
        playerClass: params.characterClass,
        kind: EXPEDITION_KINDS.HUNT,
        guaranteedMinQuality: quest.isChapterFinale ? "RARE" : "MAGIC",
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
          data: { itemId: created.id, characterId: params.characterId, type: "CREATED", reason: `zadanie: ${quest.title}` },
        });
        lootItemName = item.name;
      }
    }

    if (quest.special?.active && quest.special.key === "STAMINA_30") {
      staminaBonus = 30;
    }
    if (quest.special?.active && quest.special.key === "GOLD_BONUS" && quest.key === "ksiega-zaklec") {
      goldBonus += 300;
    }

    if (quest.isChapterFinale) {
      const chapterReward = CHAPTER_REWARDS[quest.chapter];
      goldBonus += chapterReward.goldBonus;
      if (chapterReward.titleKey && chapterReward.titleName) {
        await tx.characterTitle.upsert({
          where: { characterId_titleKey: { characterId: params.characterId, titleKey: chapterReward.titleKey } },
          create: { characterId: params.characterId, titleKey: chapterReward.titleKey, active: false },
          update: {},
        });
        chapterRewardTitle = chapterReward.titleName;
      }
    }

    await tx.gameEvent.create({
      data: {
        characterId: params.characterId,
        type: "zadanie ukończone",
        details: { quest: quest.key, xp: xpBonus, gold: goldBonus },
      },
    });

    rewards.push({
      questKey: quest.key,
      title: quest.title,
      xpBonus,
      goldBonus,
      staminaBonus,
      lootItemName,
      chapterRewardTitle,
    });
  }

  return rewards;
}

export function allQuestKeysForChapter(chapter: 1 | 2): string[] {
  return QUESTS.filter((q) => q.chapter === chapter).map((q) => q.key);
}

export { getQuest };
