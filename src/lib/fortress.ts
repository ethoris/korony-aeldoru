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
import type { ArmyRow } from "@/game/fortress/armySettle";
import { armyFoodPerHour, settleArmies } from "@/game/fortress/armySettle";
import type { BuildingLevels, QueueEntry, Resources } from "@/game/fortress/settle";
import { settleFortress } from "@/game/fortress/settle";
import { UNITS, UNIT_KEYS, armyLimit } from "@/game/data/units";
import type { UnitKey } from "@/game/data/units";

import { checkDeityQuests, recordUnitsTrainedSignal } from "./deityQuests";
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

export interface ArmyView {
  unitKey: UnitKey;
  quantity: number;
  trainingQuantity: number;
  trainingEndAt: Date | null;
}

export interface FortressView {
  buildingLevels: BuildingLevels;
  resources: Resources;
  goldVault: number;
  queue: QueueEntry[];
  protectionUntil: Date;
  armies: ArmyView[];
}

const UNIT_FOOD_PER_HOUR = Object.fromEntries(UNIT_KEYS.map((k) => [k, UNITS[k].foodPerHour])) as Record<UnitKey, number>;

async function loadAndSettle(tx: Prisma.TransactionClient, characterId: string, now: Date): Promise<FortressView | null> {
  const fortress = await tx.fortress.findUnique({ where: { characterId }, include: { buildQueue: true, armies: true } });
  if (!fortress) return null;

  const queue: QueueEntry[] = fortress.buildQueue
    .map((entry) => ({ id: entry.id, building: entry.building as BuildingKey, targetLevel: entry.targetLevel, endAt: entry.endAt }))
    .sort((a, b) => a.endAt.getTime() - b.endAt.getTime());

  const hoursElapsed = Math.max(0, (now.getTime() - fortress.lastProductionAt.getTime()) / (60 * 60 * 1000));

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

  const armyRows: ArmyRow[] = fortress.armies.map((a) => ({
    unitKey: a.unitKey as UnitKey,
    quantity: a.quantity,
    trainingQuantity: a.trainingQuantity,
    trainingEndAt: a.trainingEndAt,
  }));
  const armyResult = settleArmies(armyRows, now);
  for (const row of armyResult.armies) {
    const original = fortress.armies.find((a) => a.unitKey === row.unitKey);
    if (!original) continue;
    if (row.quantity !== original.quantity || row.trainingQuantity !== original.trainingQuantity) {
      await tx.army.update({
        where: { id: original.id },
        data: { quantity: row.quantity, trainingQuantity: row.trainingQuantity, trainingEndAt: row.trainingEndAt },
      });
    }
  }
  const totalTrained = armyResult.completed.reduce((sum, c) => sum + c.quantity, 0);
  if (totalTrained > 0) {
    await recordUnitsTrainedSignal(tx, characterId, totalTrained);
    const character = await tx.character.findUnique({ where: { id: characterId } });
    if (character) {
      await checkDeityQuests(tx, characterId, character.level, character.deity, {
        strength: character.strength,
        dexterity: character.dexterity,
        vitality: character.vitality,
        intellect: character.intellect,
      });
    }
  }

  // Żywność/h całego wojska (docs/gdd/09-twierdza-i-wojna.md); uproszczenie –
  // liczona z ilości PO rozliczeniu szkoleń za cały upływ czasu, bez dzielenia
  // na odcinki jak przy produkcji budynków (szkolenia kończą się rzadziej).
  const foodUpkeep = armyFoodPerHour(armyResult.armies, UNIT_FOOD_PER_HOUR) * hoursElapsed;
  const foodAfterUpkeep = Math.max(0, result.resources.food - foodUpkeep);

  await tx.fortress.update({
    where: { characterId },
    data: {
      buildingLevels: result.buildingLevels,
      wood: Math.round(result.resources.wood),
      stone: Math.round(result.resources.stone),
      iron: Math.round(result.resources.iron),
      food: Math.round(foodAfterUpkeep),
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
      food: Math.round(foodAfterUpkeep),
      mana: Math.round(result.resources.mana),
    },
    goldVault: fortress.goldVault,
    queue: result.remainingQueue,
    protectionUntil: fortress.protectionUntil,
    armies: armyResult.armies,
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

export type TrainUnitsResult = { ok: true; endAt: Date } | { error: string };

/** Szkoli jednostki w Koszarach (docs/gdd/09-twierdza-i-wojna.md). Jedno szkolenie na typ jednostki naraz. */
export async function trainUnits(characterId: string, unitKey: UnitKey, quantity: number): Promise<TrainUnitsResult> {
  const def = UNITS[unitKey];
  if (!def) return { error: "Nieznana jednostka." };
  if (!Number.isInteger(quantity) || quantity <= 0) return { error: "Nieprawidłowa liczba jednostek." };

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const view = await loadAndSettle(tx, characterId, now);
    if (!view) return { error: "Nie masz jeszcze twierdzy." };

    const koszaryLevel = view.buildingLevels.KOSZARY;
    if (koszaryLevel < def.koszaryLevelRequired) {
      return { error: `Potrzebujesz Koszar poziomu ${def.koszaryLevelRequired}, masz ${koszaryLevel}.` };
    }

    const existing = view.armies.find((a) => a.unitKey === unitKey);
    if (existing && existing.trainingQuantity > 0) {
      return { error: `${def.name} już się szkoli.` };
    }

    const totalArmy = view.armies.reduce((sum, a) => sum + a.quantity + a.trainingQuantity, 0);
    if (totalArmy + quantity > armyLimit(koszaryLevel)) {
      return { error: `Limit wojska to ${armyLimit(koszaryLevel)} (poziom Koszar × 50).` };
    }

    const cost = {
      wood: def.cost.wood * quantity,
      iron: def.cost.iron * quantity,
      food: def.cost.food * quantity,
      gold: def.cost.gold * quantity,
      mana: (def.cost.mana ?? 0) * quantity,
    };
    if (view.resources.wood < cost.wood || view.resources.iron < cost.iron || view.resources.food < cost.food || view.resources.mana < cost.mana) {
      return { error: "Nie masz wystarczająco surowców." };
    }
    const character = await tx.character.findUniqueOrThrow({ where: { id: characterId } });
    if (character.goldPouch < cost.gold) {
      return { error: `Potrzebujesz ${cost.gold} złota, masz ${character.goldPouch}.` };
    }

    const minutes = def.trainingMinutesPerUnit * quantity;
    const endAt = new Date(now.getTime() + minutes * 60 * 1000);
    const fortressRow = await tx.fortress.findUniqueOrThrow({ where: { characterId } });

    await tx.fortress.update({
      where: { characterId },
      data: {
        wood: view.resources.wood - cost.wood,
        iron: view.resources.iron - cost.iron,
        food: view.resources.food - cost.food,
        mana: view.resources.mana - cost.mana,
      },
    });

    if (existing) {
      await tx.army.update({
        where: { fortressId_unitKey: { fortressId: fortressRow.id, unitKey } },
        data: { trainingQuantity: quantity, trainingEndAt: endAt },
      });
    } else {
      await tx.army.create({ data: { fortressId: fortressRow.id, unitKey, quantity: 0, trainingQuantity: quantity, trainingEndAt: endAt } });
    }

    if (cost.gold > 0) {
      const newGoldPouch = character.goldPouch - cost.gold;
      await tx.character.update({ where: { id: characterId }, data: { goldPouch: newGoldPouch } });
      await tx.goldEvent.create({
        data: { characterId, amount: -cost.gold, balanceAfter: newGoldPouch, reason: `koszary: szkolenie ${def.name} ×${quantity}` },
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
