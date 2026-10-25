import "server-only";

import { buildHeroConfigFromEquipment } from "@/game/character/combatLoadout";
import { applyExperience, experienceToNextLevel } from "@/game/character/experience";
import { dayKeyFor } from "@/game/data/dailyReset";
import { simulatePvpDuel } from "@/game/combat/duel";
import { generatePvpReport } from "@/game/combat/generatePvpReport";
import type { ReportLine } from "@/game/combat/report";
import type { BattleResult, Tactic } from "@/game/combat/types";
import type { ItemAffixInstance } from "@/game/items/types";
import { NEW_PLAYER_PROTECTION_DAYS, isNewPlayerProtected, protectionEndsAt } from "@/game/character/newPlayerProtection";
import { fameDelta } from "@/game/pvp/fame";

import { checkDeityQuests, recordPvpWinSignal } from "./deityQuests";
import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";

export const PVP_UNLOCK_LEVEL = 15;
export const PVP_LEVEL_RANGE = 5;
export const PVP_MAX_ATTACKS_PER_DAY = 3;
/** Konto nieaktywne ponad 7 dni: nagroda spada do zera, żeby nie farmić doświadczenia (docs/gdd/00-glowny.md). */
export const PVP_INACTIVE_DAYS = 7;
/** GDD nie podaje wprost ile PD daje wygrana – własna decyzja (do przeglądu): 5% pełnego poziomu, jak drobne zlecenie. */
export const PVP_WIN_XP_PERCENT = 0.05;

async function loadHeroConfig(tx: Prisma.TransactionClient, characterId: string, tactic?: Tactic) {
  const character = await tx.character.findUniqueOrThrow({ where: { id: characterId } });
  const items = await tx.item.findMany({ where: { characterId, location: "EQUIPPED" } });
  const equippedItems = items.map((item) => ({
    slot: item.slot,
    damageMin: item.damageMin,
    damageMax: item.damageMax,
    armor: item.armor,
    traits: (item.traits as unknown as ItemAffixInstance[]) ?? [],
    upgrade: item.upgrade,
    rune: item.rune,
    templateKey: item.templateKey,
  }));
  const hero = buildHeroConfigFromEquipment({
    classKey: character.class,
    level: character.level,
    stats: {
      strength: character.strength,
      dexterity: character.dexterity,
      vitality: character.vitality,
      intellect: character.intellect,
    },
    tactic,
    equippedItems,
    deity: character.deity,
    deityGrace: character.deityGrace,
  });
  return { character, hero };
}

function dayStart(now: Date): Date {
  return new Date(Date.parse(`${dayKeyFor(now)}T06:00:00.000Z`));
}

export interface OpponentView {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  fame: number;
  attacksLeftToday: number;
}

/** Przeciwnicy w zakresie ±5 poziomów (docs/gdd/00-glowny.md), bez samego siebie. */
export async function listOpponents(characterId: string): Promise<OpponentView[]> {
  const character = await prisma.character.findUniqueOrThrow({ where: { id: characterId } });
  const candidates = await prisma.character.findMany({
    where: {
      id: { not: characterId },
      server: character.server,
      level: { gte: character.level - PVP_LEVEL_RANGE, lte: character.level + PVP_LEVEL_RANGE },
      createdAt: { lt: new Date(Date.now() - NEW_PLAYER_PROTECTION_DAYS * 24 * 60 * 60 * 1000) },
    },
    orderBy: { level: "desc" },
    take: 20,
    select: { id: true, name: true, race: true, class: true, level: true, fame: true },
  });

  const start = dayStart(new Date());
  const result: OpponentView[] = [];
  for (const candidate of candidates) {
    const attacksToday = await prisma.battleReport.count({
      where: { characterId, opponentKey: `pvp:${candidate.id}`, createdAt: { gte: start } },
    });
    result.push({ ...candidate, attacksLeftToday: Math.max(0, PVP_MAX_ATTACKS_PER_DAY - attacksToday) });
  }
  return result;
}

export type AttackPlayerResult =
  | { ok: true; result: BattleResult; report: ReportLine[]; fameDeltaSelf: number; goldGained: number; experienceGained: number }
  | { error: string };

/** Pojedynek PvP (docs/gdd/00-glowny.md, docs/gdd/02-systemy-walki.md). */
export async function attackPlayer(attackerId: string, defenderId: string, tactic: Tactic = "BALANCED"): Promise<AttackPlayerResult> {
  if (attackerId === defenderId) return { error: "Nie możesz zaatakować samego siebie." };

  return prisma.$transaction(async (tx) => {
    const attackerChar = await tx.character.findUniqueOrThrow({ where: { id: attackerId } });
    const defenderChar = await tx.character.findUniqueOrThrow({ where: { id: defenderId } });

    if (attackerChar.server !== defenderChar.server) return { error: "Ten gracz jest na innym serwerze." };
    if (attackerChar.level < PVP_UNLOCK_LEVEL) return { error: `Pojedynki PvP od poziomu ${PVP_UNLOCK_LEVEL}.` };
    if (defenderChar.level < PVP_UNLOCK_LEVEL) return { error: "Ten gracz nie bierze jeszcze udziału w PvP." };
    if (Math.abs(attackerChar.level - defenderChar.level) > PVP_LEVEL_RANGE) {
      return { error: `Przeciwnik musi być w zakresie ±${PVP_LEVEL_RANGE} poziomów.` };
    }
    if (isNewPlayerProtected(defenderChar.createdAt)) {
      return { error: `Ten gracz ma ochronę nowego konta do ${protectionEndsAt(defenderChar.createdAt).toLocaleString("pl-PL")}.` };
    }
    if (attackerChar.injuredUntil && attackerChar.injuredUntil > new Date()) {
      return { error: "Jesteś ranny i nie możesz atakować." };
    }

    const start = dayStart(new Date());
    const attacksToday = await tx.battleReport.count({
      where: { characterId: attackerId, opponentKey: `pvp:${defenderId}`, createdAt: { gte: start } },
    });
    if (attacksToday >= PVP_MAX_ATTACKS_PER_DAY) {
      return { error: `Możesz zaatakować tego gracza maks. ${PVP_MAX_ATTACKS_PER_DAY} razy na dobę.` };
    }

    const { character: attackerFresh, hero: attackerHero } = await loadHeroConfig(tx, attackerId, tactic);
    const { hero: defenderHero } = await loadHeroConfig(tx, defenderId);

    const seed = Math.floor(Math.random() * 0xffffffff) + 1;
    const outcome = simulatePvpDuel(attackerHero, defenderHero, seed);
    const won = outcome.result === "WIN";

    const inactive =
      defenderChar.lastActiveAt.getTime() < Date.now() - PVP_INACTIVE_DAYS * 24 * 60 * 60 * 1000;

    let experienceGained = 0;
    let goldGained = 0;
    let fameDeltaSelf = 0;

    // GDD opisuje wzór Elo tylko dla wygranej/przegranej (wynik 1/0), bez remisu –
    // przy remisie sława się nie zmienia (bezpieczniejsze niż zgadywanie kary).
    if (!inactive && outcome.result !== "DRAW") {
      fameDeltaSelf = fameDelta(attackerFresh.fame, defenderChar.fame, won);
      if (won) {
        experienceGained = Math.round(experienceToNextLevel(attackerFresh.level) * PVP_WIN_XP_PERCENT);
        goldGained = Math.round(defenderChar.goldPouch * 0.03);
      }
    }

    await tx.character.update({
      where: { id: attackerId },
      data: { fame: Math.max(0, attackerFresh.fame + fameDeltaSelf) },
    });
    await tx.character.update({
      where: { id: defenderId },
      data: { fame: Math.max(0, defenderChar.fame - fameDeltaSelf) },
    });

    if (goldGained > 0) {
      const attackerNewGold = attackerFresh.goldPouch + goldGained;
      const defenderNewGold = defenderChar.goldPouch - goldGained;
      await tx.character.update({ where: { id: attackerId }, data: { goldPouch: attackerNewGold } });
      await tx.character.update({ where: { id: defenderId }, data: { goldPouch: defenderNewGold } });
      await tx.goldEvent.create({
        data: { characterId: attackerId, amount: goldGained, balanceAfter: attackerNewGold, reason: `PvP: wygrana z ${defenderChar.name}` },
      });
      await tx.goldEvent.create({
        data: { characterId: defenderId, amount: -goldGained, balanceAfter: defenderNewGold, reason: `PvP: przegrana z ${attackerFresh.name}` },
      });
    }

    if (experienceGained > 0) {
      const levelUp = applyExperience(attackerFresh.level, attackerFresh.experience, attackerFresh.race, experienceGained);
      await tx.character.update({
        where: { id: attackerId },
        data: { level: levelUp.level, experience: levelUp.experience, freePoints: { increment: levelUp.freePointsGained } },
      });
    }

    const report = generatePvpReport(
      outcome,
      {
        attackerName: attackerFresh.name,
        attackerClass: attackerFresh.class,
        defenderName: defenderChar.name,
        defenderClass: defenderChar.class,
        experience: experienceGained,
        gold: goldGained,
      },
      seed,
    );

    await tx.battleReport.create({
      data: {
        characterId: attackerId,
        opponentKey: `pvp:${defenderId}`,
        seed: BigInt(seed),
        result: outcome.result,
        turns: JSON.parse(JSON.stringify(report)),
        loot: [],
      },
    });

    await tx.gameEvent.create({
      data: {
        characterId: attackerId,
        type: "pojedynek PvP",
        details: { opponent: defenderChar.name, result: outcome.result, fameDelta: fameDeltaSelf, inactive },
      },
    });

    if (won) {
      await recordPvpWinSignal(tx, attackerId, tactic);
    }
    const deityCompletions = await checkDeityQuests(tx, attackerId, attackerFresh.level, attackerFresh.deity, {
      strength: attackerFresh.strength,
      dexterity: attackerFresh.dexterity,
      vitality: attackerFresh.vitality,
      intellect: attackerFresh.intellect,
    });
    const fullReport = [
      ...report,
      ...deityCompletions.map((c) => ({ text: `Zadanie bóstwa ukończone: ${c.title} Zdobywasz łaskę.` })),
    ];

    return { ok: true, result: outcome.result, report: fullReport, fameDeltaSelf, goldGained, experienceGained };
  });
}
