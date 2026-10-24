import "server-only";

import { buildHeroConfigFromEquipment } from "@/game/character/combatLoadout";
import type { EquippedItemSummary } from "@/game/character/combatLoadout";
import { validateAbilitySelection } from "@/game/character/abilitySelection";
import { applyExperience } from "@/game/character/experience";
import { MAX_STAMINA, regenerateStamina } from "@/game/character/stamina";
import type { Element, ExpeditionKind, Tactic } from "@/game/combat/types";
import { generateReport } from "@/game/combat/generateReport";
import { EXPEDITION_KINDS } from "@/game/data/expeditionKinds";
import { AFFIXES } from "@/game/data/itemAffixes";
import { getLocation, LOCATIONS } from "@/game/data/locations";
import { MAX_BELT_POTIONS, getPotion } from "@/game/data/potions";
import { getMonster } from "@/game/data/monsters";
import { resolveExpedition } from "@/game/expeditions/resolveExpedition";
import type { ItemAffixInstance } from "@/game/items/types";
import { isLocationUnlocked, progressLocationQuests } from "@/lib/quests";

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
  selectedAbilities: string[] = [],
  spellElement: Element | null = null,
  selectedPotions: string[] = [],
): Promise<StartExpeditionError | { expeditionId: string; endAt: Date }> {
  const character = await prisma.character.findUniqueOrThrow({ where: { id: characterId } });
  const now = new Date();

  if (character.injuredUntil && character.injuredUntil > now) {
    return { error: "Jesteś ranny i nie możesz ruszyć na wyprawę." };
  }

  const abilityValidation = validateAbilitySelection(character.class, character.level, selectedAbilities);
  if (!abilityValidation.ok) {
    return { error: abilityValidation.error };
  }

  const uniquePotions = Array.from(new Set(selectedPotions));
  if (uniquePotions.length > MAX_BELT_POTIONS) {
    return { error: `Możesz zabrać maksymalnie ${MAX_BELT_POTIONS} mikstury.` };
  }
  for (const key of uniquePotions) {
    const potion = getPotion(key);
    if (!potion || potion.kind !== "COMBAT") {
      return { error: `Mikstury "${key}" nie można zabrać na wyprawę.` };
    }
    const owned = await prisma.consumable.findUnique({ where: { characterId_kind: { characterId, kind: key } } });
    if (!owned || owned.quantity <= 0) {
      return { error: `Nie masz mikstury: ${potion.name}.` };
    }
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
  if (!(await isLocationUnlocked(prisma, characterId, locationKey))) {
    return { error: "Najpierw ukończ zadanie fabularne poprzedniej lokacji." };
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

  const equippedItemsAtStart = await loadEquippedItems(prisma, characterId);
  const timeReductionPercent = Math.min(
    AFFIXES.expeditionTimeReductionPercent.cap ?? Infinity,
    equippedItemsAtStart.reduce(
      (sum, item) => sum + item.traits.filter((t) => t.key === "expeditionTimeReductionPercent").reduce((s, t) => s + t.value, 0),
      0,
    ),
  );
  const durationMs = Math.round(location.timeMinutes * kindDef.timeMultiplier * 60 * 1000 * (1 - timeReductionPercent / 100));
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
      data: {
        characterId,
        locationKey,
        kind,
        tactic,
        seed,
        startAt: now,
        endAt,
        abilities: abilityValidation.selected,
        spellElement: character.class === "MAGE" ? spellElement ?? "fire" : null,
        potions: uniquePotions,
      },
    });

    await tx.gameEvent.create({
      data: {
        characterId,
        type: "wyprawa: start",
        details: { location: locationKey, kind, tactic, abilities: abilityValidation.selected, potions: uniquePotions },
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
    const selectedAbilities = (expedition.abilities as unknown as string[]) ?? [];
    const selectedPotions = (expedition.potions as unknown as string[]) ?? [];
    const spellElement = expedition.spellElement as Element | null;

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
      selectedAbilities,
      selectedPotions,
      spellElement: spellElement ?? undefined,
    });

    const afterBattleLevel = applyExperience(character.level, character.experience, character.race, resolution.totalXp);
    const goldAfterBattle = Math.max(0, character.goldPouch + resolution.totalGoldDelta);
    const newInjuredUntil =
      resolution.injuredMinutes > 0 ? new Date(Date.now() + resolution.injuredMinutes * 60 * 1000) : character.injuredUntil;

    const winCount = resolution.fights.filter((f) => f.battle.result === "WIN").length;
    const questRewards = await progressLocationQuests(tx, {
      characterId: character.id,
      characterLevel: afterBattleLevel.level,
      characterClass: character.class,
      locationKey: location.key,
      expeditionKind: expedition.kind,
      winCount,
      bossKey: expedition.kind === "BOSS" ? (location.bossKey ?? null) : null,
      bossResult: expedition.kind === "BOSS" ? resolution.overallResult : null,
    });

    const questXp = questRewards.reduce((sum, r) => sum + r.xpBonus, 0);
    const questGold = questRewards.reduce((sum, r) => sum + r.goldBonus, 0);
    const questStamina = questRewards.reduce((sum, r) => sum + r.staminaBonus, 0);

    const leveled =
      questXp > 0
        ? applyExperience(afterBattleLevel.level, afterBattleLevel.experience, character.race, questXp)
        : afterBattleLevel;
    const newGoldPouch = goldAfterBattle + questGold;
    const freePointsGained = afterBattleLevel.freePointsGained + (questXp > 0 ? leveled.freePointsGained : 0);

    await tx.character.update({
      where: { id: character.id },
      data: {
        level: leveled.level,
        experience: leveled.experience,
        freePoints: character.freePoints + freePointsGained,
        goldPouch: newGoldPouch,
        stamina: Math.min(MAX_STAMINA, character.stamina + questStamina),
        injuredUntil: newInjuredUntil,
        fightsSinceRareDrop: resolution.fightsSinceRareDropAfter,
      },
    });

    if (questGold !== 0) {
      await tx.goldEvent.create({
        data: {
          characterId: character.id,
          amount: questGold,
          balanceAfter: newGoldPouch,
          reason: "zadanie ukończone",
        },
      });
    }

    await tx.expedition.update({ where: { id: expedition.id }, data: { settled: true } });

    for (const potionKey of resolution.potionsConsumed) {
      await tx.consumable.updateMany({
        where: { characterId: character.id, kind: potionKey, quantity: { gt: 0 } },
        data: { quantity: { decrement: 1 } },
      });
    }

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

    if (leveled.level > character.level) {
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
      spellElement: spellElement ?? undefined,
      equippedItems,
      selectedAbilities,
      selectedPotions,
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

    if (questRewards.length > 0) {
      const questLines = questRewards.map((r) => {
        const extras = [
          r.lootItemName ? `przedmiot: ${r.lootItemName}` : null,
          r.chapterRewardTitle ? `tytuł: ${r.chapterRewardTitle}` : null,
        ].filter(Boolean);
        return (
          `Zadanie ukończone: ${r.title}. Zdobywasz ${r.xpBonus} PD i ${r.goldBonus} złota` +
          (extras.length ? ` (${extras.join(", ")}).` : ".")
        );
      });
      allLines.push(questLines);
    }

    return allLines;
  });
}

export { MAX_STAMINA };
