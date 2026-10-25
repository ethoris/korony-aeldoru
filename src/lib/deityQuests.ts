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

/** Które klucze "counter:*" (QuestProgress) potrzebuje dany warunek – do jednego zbiorczego odczytu zamiast N osobnych. */
function neededCounterKeysFor(condition: DeityQuestCondition): string[] {
  switch (condition.type) {
    case "WIN_TYPE":
      return condition.monsterTypes.map((t) => `winType:${t}`);
    case "WIN_NO_POTION_TYPE":
      return condition.monsterTypes.map((t) => `winNoPotionType:${t}`);
    case "WIN_NO_POTION_ANY":
      return ["winNoPotionAny"];
    case "DEEP_WIN_NO_POTION":
      return ["deepWinNoPotion"];
    case "BOSS_DEFEAT_NO_POTION":
      return ["bossWinNoPotion"];
    case "SCOUT_WIN":
      return ["scoutWin"];
    case "LOSE_COUNT":
      return ["loseTotal"];
    case "NARROW_WIN":
      return ["narrowWin"];
    case "CRIT_COUNT":
      return ["critTotal"];
    case "CRIT_COUNT_BOSS":
      return ["critBoss"];
    case "DODGE_COUNT":
      return ["dodgeTotal"];
    case "BOSS_COMEBACK":
      return ["bossComeback"];
    case "PVP_WIN_TACTIC":
      return [condition.tactic === "AGGRESSIVE" ? "pvpWinAggressive" : "pvpWinAny"];
    case "UPGRADE_SUCCESS":
      return ["upgradeSuccess"];
    case "UNITS_TRAINED":
      return ["unitsTrained"];
    case "RAID_WIN":
      return ["raidWin"];
    case "RAID_LOOT":
      return ["raidLoot"];
    case "SIEGE_WIN":
      return ["siegeWin"];
    case "MARKET_SOLD_GOLD":
      return ["marketSoldGold"];
    case "EXPEDITION_GOLD":
      return ["expeditionGold"];
    case "INJURY_HEALED":
      return ["injuryHealed"];
    default:
      // VAULT_GOLD_REACHED/UPGRADE_REACHED/ITEM_AFFIX_COUNT/ITEM_QUALITY_COUNT/STAT_REACHED/SET_COMPLETE nie używają liczników.
      return [];
  }
}

interface EvalContext {
  stats: { strength: number; dexterity: number; vitality: number; intellect: number };
  counters: Map<string, number>;
  fortressGoldVault: number;
  items: { quality: string; upgrade: number; location: string; templateKey: string | null; traits: unknown }[];
}

function counterFromMap(counters: Map<string, number>, key: string): number {
  return counters.get(key) ?? 0;
}

/**
 * Jak dawne evaluateCondition, ale synchroniczne – działa na już wczytanych
 * danych (liczniki/fortress/items), bez odczytu z bazy per warunek. checkDeityQuests
 * wczytuje te dane raz, zbiorczo, dla wszystkich sprawdzanych zadań naraz.
 */
function evaluateConditionSync(condition: DeityQuestCondition, ctx: EvalContext): number {
  switch (condition.type) {
    case "WIN_TYPE":
      return condition.monsterTypes.reduce((sum, t) => sum + counterFromMap(ctx.counters, `winType:${t}`), 0);
    case "WIN_NO_POTION_TYPE":
      return condition.monsterTypes.reduce((sum, t) => sum + counterFromMap(ctx.counters, `winNoPotionType:${t}`), 0);
    case "WIN_NO_POTION_ANY":
      return counterFromMap(ctx.counters, "winNoPotionAny");
    case "DEEP_WIN_NO_POTION":
      return counterFromMap(ctx.counters, "deepWinNoPotion");
    case "BOSS_DEFEAT_NO_POTION":
      return counterFromMap(ctx.counters, "bossWinNoPotion");
    case "SCOUT_WIN":
      return counterFromMap(ctx.counters, "scoutWin");
    case "LOSE_COUNT":
      return counterFromMap(ctx.counters, "loseTotal");
    case "NARROW_WIN":
      return counterFromMap(ctx.counters, "narrowWin");
    case "CRIT_COUNT":
      return counterFromMap(ctx.counters, "critTotal");
    case "CRIT_COUNT_BOSS":
      return counterFromMap(ctx.counters, "critBoss");
    case "DODGE_COUNT":
      return counterFromMap(ctx.counters, "dodgeTotal");
    case "BOSS_COMEBACK":
      return counterFromMap(ctx.counters, "bossComeback");
    case "PVP_WIN_TACTIC":
      return counterFromMap(ctx.counters, condition.tactic === "AGGRESSIVE" ? "pvpWinAggressive" : "pvpWinAny");
    case "UPGRADE_SUCCESS":
      return counterFromMap(ctx.counters, "upgradeSuccess");
    case "UNITS_TRAINED":
      return counterFromMap(ctx.counters, "unitsTrained");
    case "RAID_WIN":
      return counterFromMap(ctx.counters, "raidWin");
    case "RAID_LOOT":
      return counterFromMap(ctx.counters, "raidLoot");
    case "SIEGE_WIN":
      return counterFromMap(ctx.counters, "siegeWin");
    case "MARKET_SOLD_GOLD":
      return counterFromMap(ctx.counters, "marketSoldGold");
    case "EXPEDITION_GOLD":
      return counterFromMap(ctx.counters, "expeditionGold");
    case "INJURY_HEALED":
      return counterFromMap(ctx.counters, "injuryHealed");
    case "VAULT_GOLD_REACHED":
      return ctx.fortressGoldVault;
    case "UPGRADE_REACHED":
      return ctx.items.reduce((max, i) => Math.max(max, i.upgrade ?? 0), 0);
    case "ITEM_AFFIX_COUNT":
      return ctx.items.filter((i) => (i.traits as unknown as { key: string }[]).some((t) => t.key === condition.affixKey)).length;
    case "ITEM_QUALITY_COUNT":
      return ctx.items.filter((i) => i.quality === condition.quality).length;
    case "STAT_REACHED":
      return ctx.stats[condition.stat];
    case "SET_COMPLETE": {
      const bySet = new Map<string, Set<string>>();
      for (const item of ctx.items) {
        if (item.location !== "EQUIPPED") continue;
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

const ITEM_DEPENDENT_CONDITIONS = new Set(["UPGRADE_REACHED", "ITEM_AFFIX_COUNT", "ITEM_QUALITY_COUNT", "SET_COMPLETE"]);

/**
 * Sprawdza i przyznaje zadania bóstwa dostępne na obecnym poziomie (Świątynia
 * poziomu 1+ wymagana). Wczytuje liczniki/fortecę/przedmioty RAZ dla
 * wszystkich sprawdzanych zadań (zamiast osobno dla każdego w pętli) – przy
 * 10 zadaniach na bóstwo to różnica między ~3 a ~30+ zapytaniami w jednej
 * transakcji rozliczenia wyprawy (patrz komentarz przy TRANSACTION_OPTIONS
 * w src/lib/expeditions.ts).
 */
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
  if (eligible.length === 0) return [];

  const existingRows = await tx.questProgress.findMany({
    where: { characterId, questKey: { in: eligible.map((d) => d.key) } },
  });
  const existingByKey = new Map(existingRows.map((r) => [r.questKey, r]));
  const toEvaluate = eligible.filter((def) => existingByKey.get(def.key)?.state !== "COMPLETED");
  if (toEvaluate.length === 0) return [];

  const neededCounterKeys = new Set<string>();
  for (const def of toEvaluate) for (const key of neededCounterKeysFor(def.condition)) neededCounterKeys.add(key);
  const counterRows = neededCounterKeys.size
    ? await tx.questProgress.findMany({
        where: { characterId, questKey: { in: [...neededCounterKeys].map((k) => `${COUNTER_PREFIX}${k}`) } },
      })
    : [];
  const counters = new Map(counterRows.map((r) => [r.questKey.slice(COUNTER_PREFIX.length), r.counter]));

  const needsItems = toEvaluate.some((def) => ITEM_DEPENDENT_CONDITIONS.has(def.condition.type));
  const items = needsItems ? await tx.item.findMany({ where: { characterId } }) : [];

  const ctx: EvalContext = { stats, counters, fortressGoldVault: fortress?.goldVault ?? 0, items };

  const completions: DeityQuestCompletion[] = [];
  const writes: Promise<unknown>[] = [];

  for (const def of toEvaluate) {
    const value = evaluateConditionSync(def.condition, ctx);
    if (value >= def.condition.target) {
      writes.push(
        tx.questProgress.upsert({
          where: { characterId_questKey: { characterId, questKey: def.key } },
          create: { characterId, questKey: def.key, state: "COMPLETED", counter: value },
          update: { state: "COMPLETED", counter: value },
        }),
      );
      writes.push(tx.character.update({ where: { id: characterId }, data: { deityGrace: { increment: 1 } } }));
      writes.push(tx.gameEvent.create({ data: { characterId, type: "zadanie bóstwa", details: { quest: def.key, deity } } }));
      completions.push({ title: def.title, grace: 1 });
    } else if ((existingByKey.get(def.key)?.counter ?? -1) !== value) {
      // Pomijamy zapis, gdy licznik się nie zmienił od ostatniego sprawdzenia – mniej zapytań bez zmiany stanu.
      writes.push(
        tx.questProgress.upsert({
          where: { characterId_questKey: { characterId, questKey: def.key } },
          create: { characterId, questKey: def.key, state: "ACTIVE", counter: value },
          update: { counter: value },
        }),
      );
    }
  }

  await Promise.all(writes);

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
