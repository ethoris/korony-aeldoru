import "server-only";

import type { BuildingKey, ResourceKey } from "@/game/data/buildings";
import {
  BUILDINGS,
  BUILDING_KEYS,
  FORTRESS_PROTECTION_DAYS,
  FORTRESS_STARTER_RATUSZ_LEVEL,
  FORTRESS_STARTER_RESOURCES,
  FORTRESS_UNLOCK_LEVEL,
} from "@/game/data/buildings";
import { buildingCost, buildingTimeMinutes } from "@/game/fortress/formulas";
import type { BuildingLevels, QueueEntry, Resources } from "@/game/fortress/settle";
import { settleFortress } from "@/game/fortress/settle";

import { prisma } from "./prisma";

import type { Prisma } from "@/generated/prisma/client";

function emptyLevels(): BuildingLevels {
  const levels = {} as BuildingLevels;
  for (const key of BUILDING_KEYS) levels[key] = 0;
  return levels;
}

function levelsFromJson(json: Prisma.JsonValue): BuildingLevels {
  const levels = emptyLevels();
  if (json && typeof json === "object" && !Array.isArray(json)) {
    for (const key of BUILDING_KEYS) {
      const value = (json as Record<string, unknown>)[key];
      if (typeof value === "number") levels[key] = value;
    }
  }
  return levels;
}

export interface FortressView {
  buildingLevels: BuildingLevels;
  resources: Resources;
  goldVault: number;
  queue: QueueEntry[];
  protectionUntil: Date;
}

async function loadAndSettle(tx: Prisma.TransactionClient, characterId: string, now: Date): Promise<FortressView | null> {
  const fortress = await tx.fortress.findUnique({ where: { characterId }, include: { buildQueue: true } });
  if (!fortress) return null;

  const queue: QueueEntry[] = fortress.buildQueue
    .map((entry) => ({ id: entry.id, building: entry.building as BuildingKey, targetLevel: entry.targetLevel, endAt: entry.endAt }))
    .sort((a, b) => a.endAt.getTime() - b.endAt.getTime());

  const result = settleFortress(
    {
      buildingLevels: levelsFromJson(fortress.buildingLevels),
      resources: { wood: fortress.wood, stone: fortress.stone, iron: fortress.iron, food: fortress.food, mana: fortress.mana },
      lastProductionAt: fortress.lastProductionAt,
    },
    queue,
    now,
  );

  if (result.completed.length > 0) {
    await tx.buildQueueEntry.deleteMany({ where: { id: { in: result.completed.map((c) => c.id) } } });
  }

  await tx.fortress.update({
    where: { characterId },
    data: {
      buildingLevels: result.buildingLevels,
      wood: Math.round(result.resources.wood),
      stone: Math.round(result.resources.stone),
      iron: Math.round(result.resources.iron),
      food: Math.round(result.resources.food),
      mana: Math.round(result.resources.mana),
      lastProductionAt: result.lastProductionAt,
    },
  });

  return {
    buildingLevels: result.buildingLevels,
    resources: {
      wood: Math.round(result.resources.wood),
      stone: Math.round(result.resources.stone),
      iron: Math.round(result.resources.iron),
      food: Math.round(result.resources.food),
      mana: Math.round(result.resources.mana),
    },
    goldVault: fortress.goldVault,
    queue: result.remainingQueue,
    protectionUntil: fortress.protectionUntil,
  };
}

/** Rozlicza produkcję/kolejkę i zwraca aktualny stan twierdzy, albo null gdy jeszcze nie założona. */
export async function getFortressView(characterId: string): Promise<FortressView | null> {
  return prisma.$transaction((tx) => loadAndSettle(tx, characterId, new Date()));
}

export type FoundFortressResult = { ok: true } | { error: string };

/** Zakłada twierdzę od poziomu 5 bohatera (docs/gdd/00-glowny.md). */
export async function foundFortress(characterId: string): Promise<FoundFortressResult> {
  return prisma.$transaction(async (tx) => {
    const character = await tx.character.findUniqueOrThrow({ where: { id: characterId } });
    if (character.level < FORTRESS_UNLOCK_LEVEL) {
      return { error: `Potrzebujesz poziomu ${FORTRESS_UNLOCK_LEVEL}, masz ${character.level}.` };
    }

    const existing = await tx.fortress.findUnique({ where: { characterId } });
    if (existing) return { error: "Twierdza już istnieje." };

    const levels = emptyLevels();
    levels.RATUSZ = FORTRESS_STARTER_RATUSZ_LEVEL;

    const now = new Date();
    const protectionUntil = new Date(now.getTime() + FORTRESS_PROTECTION_DAYS * 24 * 60 * 60 * 1000);

    await tx.fortress.create({
      data: {
        characterId,
        buildingLevels: levels,
        wood: FORTRESS_STARTER_RESOURCES.wood,
        stone: FORTRESS_STARTER_RESOURCES.stone,
        iron: FORTRESS_STARTER_RESOURCES.iron,
        food: FORTRESS_STARTER_RESOURCES.food,
        mana: FORTRESS_STARTER_RESOURCES.mana,
        goldVault: 0,
        lastProductionAt: now,
        protectionUntil,
      },
    });

    return { ok: true };
  });
}

export type StartBuildResult = { ok: true; endAt: Date } | { error: string };

/** Dodaje budynek do kolejki (jedna budowa naraz na start gry, docs/gdd/00-glowny.md). */
export async function startBuild(characterId: string, building: BuildingKey): Promise<StartBuildResult> {
  const def = BUILDINGS[building];
  if (!def) return { error: "Nieznany budynek." };

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const view = await loadAndSettle(tx, characterId, now);
    if (!view) return { error: "Nie masz jeszcze twierdzy." };
    if (view.queue.length > 0) return { error: "W jednym momencie trwa jedna budowa." };

    const currentLevel = view.buildingLevels[building];
    const targetLevel = currentLevel + 1;
    if (targetLevel > def.maxLevel) return { error: `${def.name} ma już maksymalny poziom.` };
    if (building !== "RATUSZ" && targetLevel > view.buildingLevels.RATUSZ) {
      return { error: "Poziom budynku nie może być wyższy niż poziom Ratusza." };
    }

    const character = await tx.character.findUniqueOrThrow({ where: { id: characterId } });
    const isDwarf = character.race === "DWARF";
    const cost = buildingCost(def, targetLevel, isDwarf);

    if (view.resources.wood < cost.wood || view.resources.stone < cost.stone || view.resources.iron < cost.iron) {
      return { error: "Nie masz wystarczająco surowców." };
    }
    if (character.goldPouch < cost.gold) {
      return { error: `Potrzebujesz ${cost.gold} złota, masz ${character.goldPouch}.` };
    }

    const minutes = buildingTimeMinutes(def, targetLevel, isDwarf);
    const endAt = new Date(now.getTime() + minutes * 60 * 1000);

    await tx.fortress.update({
      where: { characterId },
      data: {
        wood: view.resources.wood - cost.wood,
        stone: view.resources.stone - cost.stone,
        iron: view.resources.iron - cost.iron,
        buildQueue: { create: { building, targetLevel, startedAt: now, endAt } },
      },
    });

    if (cost.gold > 0) {
      const newGoldPouch = character.goldPouch - cost.gold;
      await tx.character.update({ where: { id: characterId }, data: { goldPouch: newGoldPouch } });
      await tx.goldEvent.create({
        data: { characterId, amount: -cost.gold, balanceAfter: newGoldPouch, reason: `budowa: ${def.name} poz. ${targetLevel}` },
      });
    }

    return { ok: true, endAt };
  });
}

export type VaultTransferResult = { ok: true; goldPouch: number; goldVault: number } | { error: string };

/** Przenosi złoto między sakwą bohatera a skarbcem twierdzy (docs/gdd/02-systemy-walki.md). */
export async function transferGoldToVault(characterId: string, amount: number): Promise<VaultTransferResult> {
  if (!Number.isInteger(amount) || amount <= 0) return { error: "Nieprawidłowa ilość." };

  return prisma.$transaction(async (tx) => {
    const fortress = await tx.fortress.findUnique({ where: { characterId } });
    if (!fortress) return { error: "Nie masz jeszcze twierdzy." };
    const character = await tx.character.findUniqueOrThrow({ where: { id: characterId } });

    if (character.goldPouch < amount) return { error: `Masz tylko ${character.goldPouch} złota w sakwie.` };

    const newGoldPouch = character.goldPouch - amount;
    const newGoldVault = fortress.goldVault + amount;

    await tx.character.update({ where: { id: characterId }, data: { goldPouch: newGoldPouch } });
    await tx.fortress.update({ where: { characterId }, data: { goldVault: newGoldVault } });
    await tx.goldEvent.create({
      data: { characterId, amount: -amount, balanceAfter: newGoldPouch, reason: "przelew do skarbca" },
    });

    return { ok: true, goldPouch: newGoldPouch, goldVault: newGoldVault };
  });
}

export async function transferGoldFromVault(characterId: string, amount: number): Promise<VaultTransferResult> {
  if (!Number.isInteger(amount) || amount <= 0) return { error: "Nieprawidłowa ilość." };

  return prisma.$transaction(async (tx) => {
    const fortress = await tx.fortress.findUnique({ where: { characterId } });
    if (!fortress) return { error: "Nie masz jeszcze twierdzy." };
    const character = await tx.character.findUniqueOrThrow({ where: { id: characterId } });

    if (fortress.goldVault < amount) return { error: `Masz tylko ${fortress.goldVault} złota w skarbcu.` };

    const newGoldVault = fortress.goldVault - amount;
    const newGoldPouch = character.goldPouch + amount;

    await tx.fortress.update({ where: { characterId }, data: { goldVault: newGoldVault } });
    await tx.character.update({ where: { id: characterId }, data: { goldPouch: newGoldPouch } });
    await tx.goldEvent.create({
      data: { characterId, amount, balanceAfter: newGoldPouch, reason: "wypłata ze skarbca" },
    });

    return { ok: true, goldPouch: newGoldPouch, goldVault: newGoldVault };
  });
}

export function buildingCostFor(building: BuildingKey, targetLevel: number, isDwarf: boolean) {
  return buildingCost(BUILDINGS[building], targetLevel, isDwarf);
}

export function buildingTimeMinutesFor(building: BuildingKey, targetLevel: number, isDwarf: boolean) {
  return buildingTimeMinutes(BUILDINGS[building], targetLevel, isDwarf);
}

export type { ResourceKey };
