import "server-only";

import { buildHeroConfigFromEquipment } from "@/game/character/combatLoadout";
import type { EquippedItemSummary } from "@/game/character/combatLoadout";
import { applyExperience } from "@/game/character/experience";
import { MAX_STAMINA, regenerateStamina } from "@/game/character/stamina";
import type { ExpeditionKind, Tactic } from "@/game/combat/types";
import { generateReport } from "@/game/combat/generateReport";
import { EXPEDITION_KINDS } from "@/game/data/expeditionKinds";
import { getLocation, LOCATIONS } from "@/game/data/locations";
import { getMonster } from "@/game/data/monsters";
import { resolveExpedition } from "@/game/expeditions/resolveExpedition";
import type { ItemAffixInstance } from "@/game/items/types";

import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";

export const SERVER = "Valmor";

async function loadEquippedItems(
  tx: Prisma.TransactionClient,
  characterId: string,
): Promise<EquippedItemSummary[]> {
  const items = await tx.item.findMany({ where: { characterId, location: "EQUIPPED" } });
  return items.map((item) => ({
    slot: item.slot,
    damageMin: item.damageMin,
    damageMax: item.damageMax,
    armor: item.armor,
    traits: (item.traits as unknown as ItemAffixInstance[]) ?? [],
  }));
}

export async function getCharacterForUser(userId: string) {
  return prisma.character.findUnique({ where: { userId_server: { userId, server: SERVER } } });
}

/** Odświeża wytrwałość i rozlicza zakończoną wyprawę, jeśli jedna czeka. */
export async function syncCharacter(characterId: string) {
  let character = await prisma.character.findUniqueOrThrow({ where: { id: characterId } });

  const now = new Date();
  const regen = regenerateStamina({ stamina: character.stamina, staminaUpdatedAt: character.staminaUpdatedAt }, now);
  if (regen.stamina !== character.stamina || regen.staminaUpdatedAt.getTime() !== character.staminaUpdatedAt.getTime()) {
    character = await prisma.character.update({
      where: { id: characterId },
      data: { stamina: regen.stamina, staminaUpdatedAt: regen.staminaUpdatedAt },
    });
  }

  const dueExpedition = await prisma.expedition.findFirst({
    where: { characterId, settled: false, endAt: { lte: now } },
  });

  let settlementReportLines: string[][] | null = null;
  if (dueExpedition) {
    settlementReportLines = await settleExpedition(dueExpedition.id);
    character = await prisma.character.findUniqueOrThrow({ where: { id: characterId } });
  }

  return { character, settlementReportLines };
}

export interface StartExpeditionError {
  error: string;
}

export async function startExpedition(
  characterId: string,
  locationKey: string,
  kind: ExpeditionKind,
  tactic: Tactic,
): Promise<StartExpeditionError | { expeditionId: string; endAt: Date }> {
  const character = await prisma.character.findUniqueOrThrow({ where: { id: characterId } });
  const now = new Date();

  if (character.injuredUntil && character.injuredUntil > now) {
    return { error: "Jesteś ranny i nie możesz ruszyć na wyprawę." };
  }

  const activeExpedition = await prisma.expedition.findFirst({
    where: { characterId, settled: false },
  });
  if (activeExpedition) {
    return { error: "Jesteś już na wyprawie." };
  }

  const location = LOCATIONS.find((l) => l.key === locationKey);
  if (!location) {
    return { error: "Nieznana lokacja." };
  }
  if (character.level < location.minLevel) {
    return { error: `Ta lokacja wymaga poziomu ${location.minLevel}.` };
  }

  const isBoss = kind === "BOSS";
  if (isBoss) {
    if (!location.bossKey) {
      return { error: "Ta lokacja nie ma bossa." };
    }
    const boss = getMonster(location.bossKey);
    if (character.level < boss.level) {
      return { error: `Boss wymaga poziomu ${boss.level}.` };
    }
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const existingAttempt = await prisma.bossAttempt.findUnique({
      where: { characterId_bossKey_day: { characterId, bossKey: location.bossKey, day: today } },
    });
    if (existingAttempt) {
      return { error: "Już dziś walczyłeś z tym bossem. Wróć jutro." };
    }
  }

  const kindDef = EXPEDITION_KINDS[kind];
  const stamina = Math.round(location.stamina * kindDef.timeMultiplier);
  const regen = regenerateStamina({ stamina: character.stamina, staminaUpdatedAt: character.staminaUpdatedAt }, now);
  if (regen.stamina < stamina) {
    return { error: `Potrzebujesz ${stamina} wytrwałości, masz ${regen.stamina}.` };
  }

  const durationMs = Math.round(location.timeMinutes * kindDef.timeMultiplier * 60 * 1000);
  const endAt = new Date(now.getTime() + durationMs);
  const seed = BigInt(Math.floor(Math.random() * 0xffffffff) + 1);

  const expedition = await prisma.$transaction(async (tx) => {
    if (isBoss && location.bossKey) {
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      await tx.bossAttempt.create({ data: { characterId, bossKey: location.bossKey, day: today } });
    }

    await tx.character.update({
      where: { id: characterId },
      data: { stamina: regen.stamina - stamina, staminaUpdatedAt: regen.staminaUpdatedAt },
    });

    const created = await tx.expedition.create({
      data: { characterId, locationKey, kind, tactic, seed, startAt: now, endAt },
    });

    await tx.gameEvent.create({
      data: {
        characterId,
        type: "wyprawa: start",
        details: { location: locationKey, kind, tactic },
      },
    });

    return created;
  });

  return { expeditionId: expedition.id, endAt: expedition.endAt };
}

/** Rozlicza wyprawę i zwraca linie raportu każdej walki (do wyświetlenia). */
async function settleExpedition(expeditionId: string): Promise<string[][]> {
  return prisma.$transaction(async (tx) => {
    const expedition = await tx.expedition.findUniqueOrThrow({ where: { id: expeditionId } });
    if (expedition.settled) return [];

    const character = await tx.character.findUniqueOrThrow({ where: { id: expedition.characterId } });
    const location = getLocation(expedition.locationKey);
    const equippedItems = await loadEquippedItems(tx, character.id);

    const resolution = resolveExpedition({
      classKey: character.class,
      level: character.level,
      stats: {
        strength: character.strength,
        dexterity: character.dexterity,
        vitality: character.vitality,
        intellect: character.intellect,
      },
      tactic: expedition.tactic,
      location,
      kind: expedition.kind,
      seed: Number(expedition.seed),
      startingGoldPouch: character.goldPouch,
      fightsSinceRareDrop: character.fightsSinceRareDrop,
      equippedItems,
    });

    const leveled = applyExperience(character.level, character.experience, character.race, resolution.totalXp);
    const newGoldPouch = Math.max(0, character.goldPouch + resolution.totalGoldDelta);
    const newInjuredUntil =
      resolution.injuredMinutes > 0 ? new Date(Date.now() + resolution.injuredMinutes * 60 * 1000) : character.injuredUntil;

    await tx.character.update({
      where: { id: character.id },
      data: {
        level: leveled.level,
        experience: leveled.experience,
        freePoints: character.freePoints + leveled.freePointsGained,
        goldPouch: newGoldPouch,
        injuredUntil: newInjuredUntil,
        fightsSinceRareDrop: resolution.fightsSinceRareDropAfter,
      },
    });

    await tx.expedition.update({ where: { id: expedition.id }, data: { settled: true } });

    if (resolution.totalGoldDelta !== 0) {
      await tx.goldEvent.create({
        data: {
          characterId: character.id,
          amount: resolution.totalGoldDelta,
          balanceAfter: newGoldPouch,
          reason: `wyprawa: ${location.name}`,
        },
      });
    }

    if (leveled.levelsGained > 0) {
      await tx.gameEvent.create({
        data: { characterId: character.id, type: "awans", details: { level: leveled.level } },
      });
    }

    const heroConfig = buildHeroConfigFromEquipment({
      classKey: character.class,
      level: character.level,
      stats: {
        strength: character.strength,
        dexterity: character.dexterity,
        vitality: character.vitality,
        intellect: character.intellect,
      },
      tactic: expedition.tactic,
      equippedItems,
    });

    const allLines: string[][] = [];

    for (const fight of resolution.fights) {
      const monsterDef = getMonster(fight.monsterKey);
      const lines = generateReport(
        fight.battle,
        {
          heroName: character.name,
          monster: {
            key: monsterDef.key,
            name: monsterDef.name,
            level: monsterDef.level,
            type: monsterDef.type,
            isBoss: monsterDef.isBoss,
            weakTo: monsterDef.weakTo,
            resistTo: monsterDef.resistTo,
          },
          hero: heroConfig,
          experience: fight.xpGained,
          gold: Math.max(0, fight.goldDelta),
        },
        fight.seedUsed,
      );
      allLines.push(lines);

      let lootSummary: Array<{ name: string; slot: string; quality: string }> = [];
      if (fight.lootItem) {
        const item = await tx.item.create({
          data: {
            characterId: character.id,
            name: fight.lootItem.name,
            slot: fight.lootItem.slot,
            level: fight.lootItem.level,
            quality: fight.lootItem.quality,
            forClass: fight.lootItem.forClass,
            damageMin: fight.lootItem.damageMin,
            damageMax: fight.lootItem.damageMax,
            armor: fight.lootItem.armor,
            traits: JSON.parse(JSON.stringify(fight.lootItem.affixes)),
          },
        });
        await tx.itemEvent.create({
          data: {
            itemId: item.id,
            characterId: character.id,
            type: "CREATED",
            toState: { name: fight.lootItem.name, slot: item.slot, quality: item.quality },
            reason: `łup: ${location.name}`,
          },
        });
        lootSummary = [{ name: fight.lootItem.name, slot: fight.lootItem.slot, quality: fight.lootItem.quality }];
      }

      await tx.battleReport.create({
        data: {
          characterId: character.id,
          expeditionId: expedition.id,
          opponentKey: fight.monsterKey,
          seed: BigInt(fight.seedUsed),
          result: fight.battle.result,
          turns: lines,
          loot: lootSummary,
        },
      });
    }

    return allLines;
  });
}

export { MAX_STAMINA };
