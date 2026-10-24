import "server-only";

import type { ExpeditionResolution } from "@/game/expeditions/resolveExpedition";
import { getMonster } from "@/game/data/monsters";
import { DEITY_QUESTS, deityQuestsFor } from "@/game/data/deityQuests";
import type { DeityQuestCondition, DeityQuestDefinition } from "@/game/data/deityQuests";
import type { DeityKey } from "@/game/data/deities";
import { parseSetTemplateKey } from "@/game/data/sets";

import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";

const COUNTER_PREFIX = "counter:";
const BOSS_LOSS_PREFIX = "bossloss:";
const BOSS_COMEBACK_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

async function counterValue(tx: Prisma.TransactionClient, characterId: string, key: string): Promise<number> {
  const row = await tx.questProgress.findUnique({
    where: { characterId_questKey: { characterId, questKey: `${COUNTER_PREFIX}${key}` } },
  });
  return row?.counter ?? 0;
}

async function incrementCounter(tx: Prisma.TransactionClient, characterId: string, key: string, amount: number): Promise<void> {
  if (amount === 0) return;
  const questKey = `${COUNTER_PREFIX}${key}`;
  await tx.questProgress.upsert({
    where: { characterId_questKey: { characterId, questKey } },
    create: { characterId, questKey, state: "ACTIVE", counter: amount },
    update: { counter: { increment: amount } },
  });
}

/** Zapisuje sygnały zadań bóstw z rozliczonej wyprawy (docs/gdd/11-gospodarka-i-zadania.md). */
export async function recordExpeditionDeitySignals(
  tx: Prisma.TransactionClient,
  characterId: string,
  resolution: ExpeditionResolution,
  kind: "SCOUT" | "HUNT" | "DEEP" | "BOSS",
): Promise<void> {
  const noPotionAtAll = resolution.potionsConsumed.length === 0;

  for (const fight of resolution.fights) {
    const monster = getMonster(fight.monsterKey);
    const crits = fight.battle.events.filter((e) => e.kind === "attack" && e.actor === "hero" && e.crit).length;
    if (crits > 0) {
      await incrementCounter(tx, characterId, "critTotal", crits);
      if (fight.isBoss) await incrementCounter(tx, characterId, "critBoss", crits);
    }
    const dodges = fight.battle.events.filter((e) => e.kind === "attack" && e.actor === "monster" && !e.hit).length;
    if (dodges > 0) await incrementCounter(tx, characterId, "dodgeTotal", dodges);

    if (fight.battle.result === "WIN") {
      await incrementCounter(tx, characterId, `winType:${monster.type}`, 1);
      if (noPotionAtAll) {
        await incrementCounter(tx, characterId, `winNoPotionType:${monster.type}`, 1);
        await incrementCounter(tx, characterId, "winNoPotionAny", 1);
        if (kind === "DEEP") await incrementCounter(tx, characterId, "deepWinNoPotion", 1);
        if (fight.isBoss) await incrementCounter(tx, characterId, "bossWinNoPotion", 1);
      }
      if (kind === "SCOUT") await incrementCounter(tx, characterId, "scoutWin", 1);

      if (fight.battle.heroHpStart > 0 && fight.battle.heroHpEnd / fight.battle.heroHpStart < 0.1) {
        await incrementCounter(tx, characterId, "narrowWin", 1);
      }

      if (fight.isBoss) {
        const lossMarkerKey = `${BOSS_LOSS_PREFIX}${fight.monsterKey}`;
        const marker = await tx.questProgress.findUnique({
          where: { characterId_questKey: { characterId, questKey: lossMarkerKey } },
        });
        if (marker && Date.now() - marker.updatedAt.getTime() <= BOSS_COMEBACK_WINDOW_MS) {
          await incrementCounter(tx, characterId, "bossComeback", 1);
        }
      }
    } else if (fight.battle.result === "LOSE") {
      await incrementCounter(tx, characterId, "loseTotal", 1);
      if (fight.isBoss) {
        await tx.questProgress.upsert({
          where: { characterId_questKey: { characterId, questKey: `${BOSS_LOSS_PREFIX}${fight.monsterKey}` } },
          create: { characterId, questKey: `${BOSS_LOSS_PREFIX}${fight.monsterKey}`, state: "ACTIVE", counter: 0 },
          update: { counter: 0 },
        });
      }
    }
  }

  if (resolution.totalGoldDelta > 0) {
    await incrementCounter(tx, characterId, "expeditionGold", resolution.totalGoldDelta);
  }
}

export async function recordPvpWinSignal(tx: Prisma.TransactionClient, characterId: string, tactic: string): Promise<void> {
  await incrementCounter(tx, characterId, "pvpWinAny", 1);
  if (tactic === "AGGRESSIVE") await incrementCounter(tx, characterId, "pvpWinAggressive", 1);
}

export async function recordUpgradeSuccessSignal(tx: Prisma.TransactionClient, characterId: string): Promise<void> {
  await incrementCounter(tx, characterId, "upgradeSuccess", 1);
}

export async function recordUnitsTrainedSignal(tx: Prisma.TransactionClient, characterId: string, quantity: number): Promise<void> {
  await incrementCounter(tx, characterId, "unitsTrained", quantity);
}

export async function recordRaidWinSignal(tx: Prisma.TransactionClient, characterId: string, lootTotal: number): Promise<void> {
  await incrementCounter(tx, characterId, "raidWin", 1);
  if (lootTotal > 0) await incrementCounter(tx, characterId, "raidLoot", lootTotal);
}

export async function recordSiegeWinSignal(tx: Prisma.TransactionClient, characterId: string): Promise<void> {
  await incrementCounter(tx, characterId, "siegeWin", 1);
}

export async function recordMarketSaleSignal(tx: Prisma.TransactionClient, characterId: string, goldEarned: number): Promise<void> {
  await incrementCounter(tx, characterId, "marketSoldGold", goldEarned);
}

export async function recordInjuryHealedSignal(tx: Prisma.TransactionClient, characterId: string): Promise<void> {
  await incrementCounter(tx, characterId, "injuryHealed", 1);
}

interface SnapshotContext {
  characterId: string;
  stats: { strength: number; dexterity: number; vitality: number; intellect: number };
}

async function evaluateCondition(tx: Prisma.TransactionClient, ctx: SnapshotContext, condition: DeityQuestCondition): Promise<number> {
  switch (condition.type) {
    case "WIN_TYPE": {
      let total = 0;
      for (const type of condition.monsterTypes) total += await counterValue(tx, ctx.characterId, `winType:${type}`);
      return total;
    }
    case "WIN_NO_POTION_TYPE": {
      let total = 0;
      for (const type of condition.monsterTypes) total += await counterValue(tx, ctx.characterId, `winNoPotionType:${type}`);
      return total;
    }
    case "WIN_NO_POTION_ANY":
      return counterValue(tx, ctx.characterId, "winNoPotionAny");
    case "DEEP_WIN_NO_POTION":
      return counterValue(tx, ctx.characterId, "deepWinNoPotion");
    case "BOSS_DEFEAT_NO_POTION":
      return counterValue(tx, ctx.characterId, "bossWinNoPotion");
    case "SCOUT_WIN":
      return counterValue(tx, ctx.characterId, "scoutWin");
    case "LOSE_COUNT":
      return counterValue(tx, ctx.characterId, "loseTotal");
    case "NARROW_WIN":
      return counterValue(tx, ctx.characterId, "narrowWin");
    case "CRIT_COUNT":
      return counterValue(tx, ctx.characterId, "critTotal");
    case "CRIT_COUNT_BOSS":
      return counterValue(tx, ctx.characterId, "critBoss");
    case "DODGE_COUNT":
      return counterValue(tx, ctx.characterId, "dodgeTotal");
    case "BOSS_COMEBACK":
      return counterValue(tx, ctx.characterId, "bossComeback");
    case "PVP_WIN_TACTIC":
      return counterValue(tx, ctx.characterId, condition.tactic === "AGGRESSIVE" ? "pvpWinAggressive" : "pvpWinAny");
    case "UPGRADE_SUCCESS":
      return counterValue(tx, ctx.characterId, "upgradeSuccess");
    case "UNITS_TRAINED":
      return counterValue(tx, ctx.characterId, "unitsTrained");
    case "RAID_WIN":
      return counterValue(tx, ctx.characterId, "raidWin");
    case "RAID_LOOT":
      return counterValue(tx, ctx.characterId, "raidLoot");
    case "SIEGE_WIN":
      return counterValue(tx, ctx.characterId, "siegeWin");
    case "MARKET_SOLD_GOLD":
      return counterValue(tx, ctx.characterId, "marketSoldGold");
    case "EXPEDITION_GOLD":
      return counterValue(tx, ctx.characterId, "expeditionGold");
    case "INJURY_HEALED":
      return counterValue(tx, ctx.characterId, "injuryHealed");
    case "VAULT_GOLD_REACHED": {
      const fortress = await tx.fortress.findUnique({ where: { characterId: ctx.characterId } });
      return fortress?.goldVault ?? 0;
    }
    case "UPGRADE_REACHED": {
      const best = await tx.item.findFirst({ where: { characterId: ctx.characterId }, orderBy: { upgrade: "desc" } });
      return best?.upgrade ?? 0;
    }
    case "ITEM_AFFIX_COUNT": {
      const items = await tx.item.findMany({ where: { characterId: ctx.characterId } });
      return items.filter((i) => (i.traits as unknown as { key: string }[]).some((t) => t.key === condition.affixKey)).length;
    }
    case "ITEM_QUALITY_COUNT": {
      return tx.item.count({ where: { characterId: ctx.characterId, quality: condition.quality as never } });
    }
    case "STAT_REACHED":
      return ctx.stats[condition.stat];
    case "SET_COMPLETE": {
      const items = await tx.item.findMany({ where: { characterId: ctx.characterId, location: "EQUIPPED" } });
      const bySet = new Map<string, Set<string>>();
      for (const item of items) {
        const parsed = parseSetTemplateKey(item.templateKey);
        if (!parsed) continue;
        const slots = bySet.get(parsed.setKey) ?? new Set<string>();
        slots.add(parsed.slot);
        bySet.set(parsed.setKey, slots);
      }
      return [...bySet.values()].filter((slots) => slots.size >= 5).length;
    }
    default:
      return 0;
  }
}

export interface DeityQuestCompletion {
  title: string;
  grace: number;
}

/** Sprawdza i przyznaje zadania bóstwa dostępne na obecnym poziomie (Świątynia poziomu 1+ wymagana). */
export async function checkDeityQuests(
  tx: Prisma.TransactionClient,
  characterId: string,
  characterLevel: number,
  deity: DeityKey,
  stats: { strength: number; dexterity: number; vitality: number; intellect: number },
): Promise<DeityQuestCompletion[]> {
  const fortress = await tx.fortress.findUnique({ where: { characterId } });
  const swiatyniaLevel = (fortress?.buildingLevels as Record<string, number> | undefined)?.SWIATYNIA ?? 0;
  if (swiatyniaLevel < 1) return [];

  const eligible = deityQuestsFor(deity).filter((d) => d.level <= characterLevel);
  const completions: DeityQuestCompletion[] = [];

  for (const def of eligible) {
    const existing = await tx.questProgress.findUnique({ where: { characterId_questKey: { characterId, questKey: def.key } } });
    if (existing?.state === "COMPLETED") continue;

    const value = await evaluateCondition(tx, { characterId, stats }, def.condition);
    if (value >= def.condition.target) {
      await tx.questProgress.upsert({
        where: { characterId_questKey: { characterId, questKey: def.key } },
        create: { characterId, questKey: def.key, state: "COMPLETED", counter: value },
        update: { state: "COMPLETED", counter: value },
      });
      await tx.character.update({ where: { id: characterId }, data: { deityGrace: { increment: 1 } } });
      await tx.gameEvent.create({ data: { characterId, type: "zadanie bóstwa", details: { quest: def.key, deity } } });
      completions.push({ title: def.title, grace: 1 });
    } else {
      await tx.questProgress.upsert({
        where: { characterId_questKey: { characterId, questKey: def.key } },
        create: { characterId, questKey: def.key, state: "ACTIVE", counter: value },
        update: { counter: value },
      });
    }
  }

  return completions;
}

export function getAllDeityQuestKeys(): string[] {
  return DEITY_QUESTS.map((d) => d.key);
}

export interface DeityQuestProgressView {
  level: number;
  title: string;
  target: number;
  progress: number;
  completed: boolean;
  locked: boolean;
}

/** Widok postępu wszystkich 10 zadań bóstwa gracza, do ekranu Świątyni. */
export async function listDeityQuestProgress(characterId: string): Promise<DeityQuestProgressView[]> {
  const character = await prisma.character.findUniqueOrThrow({ where: { id: characterId } });
  const defs = deityQuestsFor(character.deity);
  const progress = await prisma.questProgress.findMany({
    where: { characterId, questKey: { in: defs.map((d) => d.key) } },
  });
  const byKey = new Map(progress.map((p) => [p.questKey, p]));

  return defs.map((def) => {
    const locked = character.level < def.level;
    const row = byKey.get(def.key);
    return {
      level: def.level,
      title: def.title,
      target: def.condition.target,
      progress: row?.counter ?? 0,
      completed: row?.state === "COMPLETED",
      locked,
    };
  });
}

export type { DeityQuestDefinition };
