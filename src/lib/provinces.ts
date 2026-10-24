import "server-only";

import { PROVINCES, ZONE_GARRISON, getProvince } from "@/game/data/provinces";
import { UNIT_KEYS } from "@/game/data/units";
import type { UnitKey } from "@/game/data/units";
import { attackerPower, defenderPower } from "@/game/fortress/raidBattle";
import type { ArmyComposition } from "@/game/fortress/raidBattle";
import { nextBattleSlot } from "@/game/provinces/siegeSchedule";

import { checkDeityQuests, recordSiegeWinSignal } from "./deityQuests";
import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";

export const SIEGE_UNLOCK_LEVEL = 20;
export const GUILD_PROVINCE_LIMIT = 6;
export const PROVINCE_PROTECTION_HOURS = 48;

function sumArmies(rows: { army: Prisma.JsonValue }[]): ArmyComposition {
  const total: ArmyComposition = {};
  for (const row of rows) {
    const army = row.army as Partial<Record<UnitKey, number>>;
    for (const key of UNIT_KEYS) {
      const qty = army[key] ?? 0;
      if (qty > 0) total[key] = (total[key] ?? 0) + qty;
    }
  }
  return total;
}

/** Rozlicza oblężenia, których termin bitwy już minął (bez procesów w tle). */
async function settlePendingSieges(): Promise<void> {
  const due = await prisma.siege.findMany({ where: { resolved: false, battleAt: { lte: new Date() } }, include: { reinforcements: true } });

  for (const siege of due) {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.siege.findUnique({ where: { id: siege.id } });
      if (!fresh || fresh.resolved) return;

      const province = getProvince(fresh.provinceKey);
      if (!province) return;

      const provinceState = await tx.provinceState.findUnique({ where: { provinceKey: fresh.provinceKey } });
      const attackerArmy = fresh.army as Partial<Record<UnitKey, number>>;

      const defenderArmy = sumArmies(siege.reinforcements);
      const isNeutral = !provinceState?.ownerCharacterId;
      const defenderPowerRaw = isNeutral ? ZONE_GARRISON[province.zone] : defenderPower(defenderArmy, 0);

      const atkRand = 0.9 + Math.random() * 0.2;
      const defRand = 0.9 + Math.random() * 0.2;
      const atk = attackerPower(attackerArmy, defenderArmy) * atkRand;
      const def = defenderPowerRaw * defRand;
      const attackerWins = atk > def;
      const stronger = Math.max(atk, def);
      const weaker = Math.min(atk, def);
      const winnerLossFraction = stronger > 0 ? Math.pow(weaker / stronger, 1.5) : 0;

      const attackerChar = await tx.character.findUniqueOrThrow({ where: { id: fresh.attackerCharacterId } });
      const attackerFortress = await tx.fortress.findUnique({ where: { characterId: fresh.attackerCharacterId } });
      const report: string[] = [`${attackerChar.name} prowadzi oblężenie: ${province.name}.`];

      if (attackerWins) {
        if (attackerFortress) {
          for (const key of UNIT_KEYS) {
            const sent = attackerArmy[key] ?? 0;
            if (sent <= 0) continue;
            const survived = Math.max(0, sent - Math.round(sent * winnerLossFraction));
            if (survived > 0) {
              await tx.army.updateMany({ where: { fortressId: attackerFortress.id, unitKey: key }, data: { quantity: { increment: survived } } });
            }
          }
        }
        const protectionUntil = new Date(Date.now() + PROVINCE_PROTECTION_HOURS * 60 * 60 * 1000);
        await tx.provinceState.upsert({
          where: { provinceKey: fresh.provinceKey },
          create: { provinceKey: fresh.provinceKey, ownerCharacterId: fresh.attackerCharacterId, capturedAt: new Date(), protectionUntil },
          update: { ownerCharacterId: fresh.attackerCharacterId, capturedAt: new Date(), protectionUntil },
        });
        await recordSiegeWinSignal(tx, fresh.attackerCharacterId);
        await checkDeityQuests(tx, fresh.attackerCharacterId, attackerChar.level, attackerChar.deity, {
          strength: attackerChar.strength,
          dexterity: attackerChar.dexterity,
          vitality: attackerChar.vitality,
          intellect: attackerChar.intellect,
        });

        report.push(`Zwycięstwo atakującego! Prowincja zdobyta, straty własne: ${Math.round(winnerLossFraction * 100)}%.`);
      } else {
        // Posiłki obrońców zostały odjęte z ich armii domowej przy wysyłce
        // (jak u atakującego); ci, którzy przetrwali, wracają do domu, resztę
        // tracą wg przewagi. Neutralny garnizon nic nie traci (to NPC).
        for (const reinforcement of siege.reinforcements) {
          const army = reinforcement.army as Partial<Record<UnitKey, number>>;
          const defFortress = await tx.fortress.findUnique({ where: { characterId: reinforcement.defenderCharacterId } });
          if (!defFortress) continue;
          for (const key of UNIT_KEYS) {
            const sent = army[key] ?? 0;
            if (sent <= 0) continue;
            const survived = Math.max(0, sent - Math.round(sent * winnerLossFraction));
            if (survived > 0) {
              await tx.army.updateMany({ where: { fortressId: defFortress.id, unitKey: key }, data: { quantity: { increment: survived } } });
            }
          }
        }
        report.push(`Obrona skuteczna! Oblężenie odparte, straty obrońców: ${Math.round(winnerLossFraction * 100)}%.`);
      }

      await tx.siege.update({
        where: { id: fresh.id },
        data: { resolved: true, result: attackerWins ? "ATTACKER_WIN" : "DEFENDER_WIN", report },
      });
    });
  }
}

export interface ProvinceView {
  key: string;
  name: string;
  region: number;
  regionName: string;
  zone: number;
  bonusText: string;
  garrison: number;
  ownerCharacterName: string | null;
  ownerGuildTag: string | null;
  protectionUntil: Date | null;
  activeSiege: { id: string; attackerName: string; battleAt: Date } | null;
}

export async function getMapState(): Promise<ProvinceView[]> {
  await settlePendingSieges();

  const states = await prisma.provinceState.findMany({
    include: { ownerCharacter: { include: { guildMembership: { include: { guild: true } } } } },
  });
  const stateByKey = new Map(states.map((s) => [s.provinceKey, s]));

  const sieges = await prisma.siege.findMany({ where: { resolved: false }, include: { attackerCharacter: true } });
  const siegeByProvince = new Map(sieges.map((s) => [s.provinceKey, s]));

  return PROVINCES.map((province) => {
    const state = stateByKey.get(province.key);
    const siege = siegeByProvince.get(province.key);
    return {
      key: province.key,
      name: province.name,
      region: province.region,
      regionName: province.regionName,
      zone: province.zone,
      bonusText: province.bonusText,
      garrison: ZONE_GARRISON[province.zone],
      ownerCharacterName: state?.ownerCharacter?.name ?? null,
      ownerGuildTag: state?.ownerCharacter?.guildMembership?.guild.tag ?? null,
      protectionUntil: state?.protectionUntil ?? null,
      activeSiege: siege ? { id: siege.id, attackerName: siege.attackerCharacter.name, battleAt: siege.battleAt } : null,
    };
  });
}

export interface RegionLordView {
  region: number;
  regionName: string;
  guildTag: string | null;
  guildName: string | null;
  provinceCount: number;
}

/** Gildia z największą liczbą prowincji w regionie mianuje lorda (remis: najpóźniejsze zdobycie, docs/gdd/10-prowincje.md). */
export async function getRegionLords(): Promise<RegionLordView[]> {
  const states = await prisma.provinceState.findMany({
    where: { ownerCharacterId: { not: null } },
    include: { ownerCharacter: { include: { guildMembership: { include: { guild: true } } } } },
  });

  const results: RegionLordView[] = [];
  for (let region = 1; region <= 5; region++) {
    const inRegion = PROVINCES.filter((p) => p.region === region).map((p) => p.key);
    const owned = states.filter((s) => inRegion.includes(s.provinceKey) && s.ownerCharacter?.guildMembership);

    const byGuild = new Map<string, { tag: string; name: string; count: number; lastCapturedAt: Date }>();
    for (const state of owned) {
      const guild = state.ownerCharacter!.guildMembership!.guild;
      const existing = byGuild.get(guild.id);
      const capturedAt = state.capturedAt ?? new Date(0);
      if (!existing) {
        byGuild.set(guild.id, { tag: guild.tag, name: guild.name, count: 1, lastCapturedAt: capturedAt });
      } else {
        existing.count += 1;
        if (capturedAt > existing.lastCapturedAt) existing.lastCapturedAt = capturedAt;
      }
    }

    const sorted = [...byGuild.values()].sort((a, b) => b.count - a.count || b.lastCapturedAt.getTime() - a.lastCapturedAt.getTime());
    const lord = sorted[0];
    results.push({
      region,
      regionName: PROVINCES.find((p) => p.region === region)!.regionName,
      guildTag: lord?.tag ?? null,
      guildName: lord?.name ?? null,
      provinceCount: lord?.count ?? 0,
    });
  }
  return results;
}

export type AnnounceSiegeResult = { ok: true; battleAt: Date } | { error: string };

export async function announceSiege(
  attackerCharacterId: string,
  provinceKey: string,
  army: Partial<Record<UnitKey, number>>,
): Promise<AnnounceSiegeResult> {
  const province = getProvince(provinceKey);
  if (!province) return { error: "Nieznana prowincja." };
  const requested = UNIT_KEYS.filter((k) => (army[k] ?? 0) > 0);
  if (requested.length === 0) return { error: "Wybierz przynajmniej jedną jednostkę." };

  await settlePendingSieges();

  return prisma.$transaction(async (tx) => {
    const attacker = await tx.character.findUniqueOrThrow({ where: { id: attackerCharacterId } });
    if (attacker.level < SIEGE_UNLOCK_LEVEL) return { error: `Oblężenia od poziomu ${SIEGE_UNLOCK_LEVEL}.` };

    const membership = await tx.guildMember.findUnique({ where: { characterId: attackerCharacterId } });
    if (!membership) return { error: "Musisz być w gildii, żeby ogłosić oblężenie." };

    const existingSiege = await tx.siege.findFirst({ where: { provinceKey, resolved: false } });
    if (existingSiege) return { error: "Ta prowincja jest już w trakcie oblężenia." };

    const state = await tx.provinceState.findUnique({ where: { provinceKey } });
    if (state?.protectionUntil && state.protectionUntil > new Date()) {
      return { error: `Prowincja ma ochronę do ${state.protectionUntil.toLocaleString("pl-PL")}.` };
    }
    if (state?.ownerCharacterId) {
      const ownerMembership = await tx.guildMember.findUnique({ where: { characterId: state.ownerCharacterId } });
      if (ownerMembership?.guildId === membership.guildId) {
        return { error: "Ta prowincja już należy do Twojej gildii." };
      }
    }

    const guildOwnedCount = await tx.provinceState.count({
      where: { ownerCharacter: { guildMembership: { guildId: membership.guildId } } },
    });
    if (guildOwnedCount >= GUILD_PROVINCE_LIMIT) {
      return { error: `Twoja gildia ma już maks. ${GUILD_PROVINCE_LIMIT} prowincji.` };
    }

    const fortress = await tx.fortress.findUnique({ where: { characterId: attackerCharacterId } });
    if (!fortress) return { error: "Nie masz jeszcze twierdzy." };
    const homeArmy = await tx.army.findMany({ where: { fortressId: fortress.id } });
    const homeByKey = new Map(homeArmy.map((a) => [a.unitKey as UnitKey, a]));
    for (const key of requested) {
      const home = homeByKey.get(key);
      if (!home || home.quantity < (army[key] ?? 0)) return { error: `Nie masz wystarczająco jednostek: ${key}.` };
    }
    for (const key of requested) {
      const home = homeByKey.get(key)!;
      await tx.army.update({ where: { id: home.id }, data: { quantity: home.quantity - (army[key] ?? 0) } });
    }

    const announcedAt = new Date();
    const battleAt = nextBattleSlot(announcedAt);
    const sentArmy: Partial<Record<UnitKey, number>> = {};
    for (const key of requested) sentArmy[key] = army[key];

    await tx.siege.create({
      data: { provinceKey, attackerCharacterId, army: sentArmy, announcedAt, battleAt },
    });

    return { ok: true, battleAt };
  });
}

export type SendReinforcementResult = { ok: true } | { error: string };

export async function sendReinforcement(
  defenderCharacterId: string,
  siegeId: string,
  army: Partial<Record<UnitKey, number>>,
): Promise<SendReinforcementResult> {
  const requested = UNIT_KEYS.filter((k) => (army[k] ?? 0) > 0);
  if (requested.length === 0) return { error: "Wybierz przynajmniej jedną jednostkę." };

  return prisma.$transaction(async (tx) => {
    const siege = await tx.siege.findUnique({ where: { id: siegeId } });
    if (!siege || siege.resolved) return { error: "To oblężenie już się zakończyło." };

    const state = await tx.provinceState.findUnique({ where: { provinceKey: siege.provinceKey } });
    if (!state?.ownerCharacterId) return { error: "Ta prowincja nie ma właściciela – garnizon NPC nie przyjmuje posiłków." };

    const defenderMembership = await tx.guildMember.findUnique({ where: { characterId: defenderCharacterId } });
    const ownerMembership = await tx.guildMember.findUnique({ where: { characterId: state.ownerCharacterId } });
    if (!defenderMembership || defenderMembership.guildId !== ownerMembership?.guildId) {
      return { error: "Tylko gildia właściciela może wysłać posiłki." };
    }

    const fortress = await tx.fortress.findUnique({ where: { characterId: defenderCharacterId } });
    if (!fortress) return { error: "Nie masz jeszcze twierdzy." };
    const homeArmy = await tx.army.findMany({ where: { fortressId: fortress.id } });
    const homeByKey = new Map(homeArmy.map((a) => [a.unitKey as UnitKey, a]));
    for (const key of requested) {
      const home = homeByKey.get(key);
      if (!home || home.quantity < (army[key] ?? 0)) return { error: `Nie masz wystarczająco jednostek: ${key}.` };
    }
    for (const key of requested) {
      const home = homeByKey.get(key)!;
      await tx.army.update({ where: { id: home.id }, data: { quantity: home.quantity - (army[key] ?? 0) } });
    }

    const sentArmy: Partial<Record<UnitKey, number>> = {};
    for (const key of requested) sentArmy[key] = army[key];
    await tx.siegeReinforcement.create({ data: { siegeId, defenderCharacterId, army: sentArmy } });

    return { ok: true };
  });
}
