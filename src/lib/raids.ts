import "server-only";

import { dayKeyFor } from "@/game/data/dailyReset";
import type { ResourceKey } from "@/game/data/buildings";
import { UNIT_KEYS } from "@/game/data/units";
import type { UnitKey } from "@/game/data/units";
import { raidProtectionPercent } from "@/game/fortress/formulas";
import { carryCapacity, resolveRaidBattle } from "@/game/fortress/raidBattle";
import type { ArmyComposition } from "@/game/fortress/raidBattle";

import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";

export const RAID_UNLOCK_LEVEL = 15;
export const RAID_MAX_PER_DAY = 2;
export const RAID_MARCH_MIN_MINUTES = 10;
export const RAID_MARCH_MAX_MINUTES = 60;
/** 20% ponad ochronę magazynu (docs/gdd/09-twierdza-i-wojna.md). */
export const RAID_LOOT_SHARE_ABOVE_PROTECTION = 0.2;

const RESOURCE_KEYS: ResourceKey[] = ["wood", "stone", "iron", "food", "mana"];

function dayStart(now: Date): Date {
  return new Date(Date.parse(`${dayKeyFor(now)}T06:00:00.000Z`));
}

async function loadArmy(tx: Prisma.TransactionClient, fortressId: string): Promise<ArmyComposition> {
  const rows = await tx.army.findMany({ where: { fortressId } });
  const army: ArmyComposition = {};
  for (const row of rows) army[row.unitKey as UnitKey] = row.quantity;
  return army;
}

export type SendRaidResult = { ok: true; arrivalAt: Date } | { error: string };

/** Wysyła napad na twierdzę innego gracza (docs/gdd/09-twierdza-i-wojna.md, od poziomu 15). */
export async function sendRaid(
  attackerCharacterId: string,
  defenderCharacterId: string,
  army: Partial<Record<UnitKey, number>>,
): Promise<SendRaidResult> {
  if (attackerCharacterId === defenderCharacterId) return { error: "Nie możesz napaść na samego siebie." };
  const requested = UNIT_KEYS.filter((k) => (army[k] ?? 0) > 0);
  if (requested.length === 0) return { error: "Wybierz przynajmniej jedną jednostkę." };
  for (const key of requested) {
    if (!Number.isInteger(army[key]) || (army[key] ?? 0) < 0) return { error: "Nieprawidłowa liczba jednostek." };
  }

  return prisma.$transaction(async (tx) => {
    const attacker = await tx.character.findUniqueOrThrow({ where: { id: attackerCharacterId } });
    const defender = await tx.character.findUniqueOrThrow({ where: { id: defenderCharacterId } });

    if (attacker.server !== defender.server) return { error: "Ten gracz jest na innym serwerze." };
    if (attacker.level < RAID_UNLOCK_LEVEL) return { error: `Napady od poziomu ${RAID_UNLOCK_LEVEL}.` };

    const attackerFortress = await tx.fortress.findUnique({ where: { characterId: attackerCharacterId } });
    if (!attackerFortress) return { error: "Nie masz jeszcze twierdzy." };
    const defenderFortress = await tx.fortress.findUnique({ where: { characterId: defenderCharacterId } });
    if (!defenderFortress) return { error: "Ten gracz nie ma jeszcze twierdzy." };
    if (defenderFortress.protectionUntil > new Date()) {
      return { error: "Ten gracz ma jeszcze ochronę nowego gracza." };
    }

    const start = dayStart(new Date());
    const raidsToday = await tx.raid.count({
      where: { attackerCharacterId, defenderCharacterId, createdAt: { gte: start } },
    });
    if (raidsToday >= RAID_MAX_PER_DAY) {
      return { error: `Możesz napaść na tę twierdzę maks. ${RAID_MAX_PER_DAY} razy na dobę.` };
    }

    const homeArmy = await tx.army.findMany({ where: { fortressId: attackerFortress.id } });
    const homeByKey = new Map(homeArmy.map((a) => [a.unitKey as UnitKey, a]));
    for (const key of requested) {
      const home = homeByKey.get(key);
      if (!home || home.quantity < (army[key] ?? 0)) {
        return { error: `Nie masz wystarczająco jednostek: ${key}.` };
      }
    }

    for (const key of requested) {
      const home = homeByKey.get(key)!;
      await tx.army.update({ where: { id: home.id }, data: { quantity: home.quantity - (army[key] ?? 0) } });
    }

    const marchMinutes =
      RAID_MARCH_MIN_MINUTES + Math.random() * (RAID_MARCH_MAX_MINUTES - RAID_MARCH_MIN_MINUTES);
    const arrivalAt = new Date(Date.now() + marchMinutes * 60 * 1000);

    const sentArmy: Partial<Record<UnitKey, number>> = {};
    for (const key of requested) sentArmy[key] = army[key];

    await tx.raid.create({
      data: { attackerCharacterId, defenderCharacterId, army: sentArmy, arrivalAt, resolved: false },
    });

    return { ok: true, arrivalAt };
  });
}

/** Rozlicza napady tego gracza (jako atakujący lub obrońca), które dotarły. */
export async function settlePendingRaids(characterId: string): Promise<void> {
  const now = new Date();
  const pending = await prisma.raid.findMany({
    where: {
      resolved: false,
      arrivalAt: { lte: now },
      OR: [{ attackerCharacterId: characterId }, { defenderCharacterId: characterId }],
    },
  });

  for (const raid of pending) {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.raid.findUnique({ where: { id: raid.id } });
      if (!fresh || fresh.resolved) return;

      const attackerFortress = await tx.fortress.findUniqueOrThrow({ where: { characterId: fresh.attackerCharacterId } });
      const defenderFortress = await tx.fortress.findUniqueOrThrow({ where: { characterId: fresh.defenderCharacterId } });
      const defenderArmy = await loadArmy(tx, defenderFortress.id);
      const muryLevel = (defenderFortress.buildingLevels as Record<string, number>).MURY ?? 0;
      const sentArmy = fresh.army as Partial<Record<UnitKey, number>>;

      const atkRand = 0.9 + Math.random() * 0.2;
      const defRand = 0.9 + Math.random() * 0.2;
      const battle = resolveRaidBattle(sentArmy, defenderArmy, muryLevel, atkRand, defRand);

      const report: string[] = [];
      const attackerChar = await tx.character.findUniqueOrThrow({ where: { id: fresh.attackerCharacterId } });
      const defenderChar = await tx.character.findUniqueOrThrow({ where: { id: fresh.defenderCharacterId } });
      report.push(`${attackerChar.name} napada na twierdzę ${defenderChar.name}.`);

      if (battle.attackerWins) {
        // Obrońca traci cały garnizon, który walczył.
        for (const key of UNIT_KEYS) {
          const qty = defenderArmy[key] ?? 0;
          if (qty <= 0) continue;
          await tx.army.updateMany({ where: { fortressId: defenderFortress.id, unitKey: key }, data: { quantity: 0 } });
        }

        // Atakujący traci część wysłanych jednostek, reszta wraca do domu.
        const survivors: Partial<Record<UnitKey, number>> = {};
        for (const key of UNIT_KEYS) {
          const sent = sentArmy[key] ?? 0;
          if (sent <= 0) continue;
          const lost = Math.round(sent * battle.winnerLossFraction);
          const survived = Math.max(0, sent - lost);
          survivors[key] = survived;
          if (survived > 0) {
            await tx.army.updateMany({
              where: { fortressId: attackerFortress.id, unitKey: key },
              data: { quantity: { increment: survived } },
            });
          }
        }

        const capacity = carryCapacity(survivors);
        const defenderResources = {
          wood: defenderFortress.wood,
          stone: defenderFortress.stone,
          iron: defenderFortress.iron,
          food: defenderFortress.food,
          mana: defenderFortress.mana,
        };
        const protectionPercent = raidProtectionPercent((defenderFortress.buildingLevels as Record<string, number>).MAGAZYN ?? 0);
        const lootableByResource: Record<ResourceKey, number> = {} as Record<ResourceKey, number>;
        let totalLootable = 0;
        for (const key of RESOURCE_KEYS) {
          const unprotected = defenderResources[key] * (1 - protectionPercent / 100);
          const lootable = unprotected * RAID_LOOT_SHARE_ABOVE_PROTECTION;
          lootableByResource[key] = lootable;
          totalLootable += lootable;
        }
        const scale = totalLootable > capacity && totalLootable > 0 ? capacity / totalLootable : 1;

        const attackerUpdate: Partial<Record<ResourceKey, { increment: number }>> = {};
        const defenderUpdate: Partial<Record<ResourceKey, { decrement: number }>> = {};
        for (const key of RESOURCE_KEYS) {
          const looted = Math.round(lootableByResource[key] * scale);
          if (looted > 0) {
            attackerUpdate[key] = { increment: looted };
            defenderUpdate[key] = { decrement: looted };
          }
        }
        if (Object.keys(attackerUpdate).length > 0) {
          await tx.fortress.update({ where: { characterId: fresh.attackerCharacterId }, data: attackerUpdate });
          await tx.fortress.update({ where: { characterId: fresh.defenderCharacterId }, data: defenderUpdate });
        }

        report.push(`Zwycięstwo atakującego! Zrabowano surowce, straty własne: ${Math.round(battle.winnerLossFraction * 100)}%.`);
        await tx.raid.update({ where: { id: raid.id }, data: { resolved: true, result: "ATTACKER_WIN", report } });
      } else {
        // Atakujący traci wszystkie wysłane jednostki (już odjęte przy wysyłce).
        for (const key of UNIT_KEYS) {
          const qty = defenderArmy[key] ?? 0;
          if (qty <= 0) continue;
          const lost = Math.round(qty * battle.winnerLossFraction);
          if (lost > 0) {
            await tx.army.updateMany({
              where: { fortressId: defenderFortress.id, unitKey: key },
              data: { quantity: { decrement: lost } },
            });
          }
        }
        report.push(`Obrona skuteczna! Napad odparty, straty obrońcy: ${Math.round(battle.winnerLossFraction * 100)}%.`);
        await tx.raid.update({ where: { id: raid.id }, data: { resolved: true, result: "DEFENDER_WIN", report } });
      }

      await tx.gameEvent.create({
        data: {
          characterId: fresh.attackerCharacterId,
          type: "napad na twierdzę",
          details: { defender: defenderChar.name, result: battle.attackerWins ? "ATTACKER_WIN" : "DEFENDER_WIN" },
        },
      });
    });
  }
}

export interface RaidView {
  id: string;
  isAttacker: boolean;
  opponentName: string;
  arrivalAt: Date;
  resolved: boolean;
  result: string | null;
  report: string[];
}

export async function listRaidsFor(characterId: string): Promise<RaidView[]> {
  await settlePendingRaids(characterId);
  const raids = await prisma.raid.findMany({
    where: { OR: [{ attackerCharacterId: characterId }, { defenderCharacterId: characterId }] },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { attackerCharacter: true, defenderCharacter: true },
  });
  return raids.map((r) => ({
    id: r.id,
    isAttacker: r.attackerCharacterId === characterId,
    opponentName: r.attackerCharacterId === characterId ? r.defenderCharacter.name : r.attackerCharacter.name,
    arrivalAt: r.arrivalAt,
    resolved: r.resolved,
    result: r.result,
    report: (r.report as unknown as string[]) ?? [],
  }));
}
