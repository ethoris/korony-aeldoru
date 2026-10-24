import "server-only";

import { guildNameKey, guildTagKey, validateGuildName, validateGuildTag } from "@/lib/validation/guildName";

import { prisma } from "./prisma";

export const GUILD_MAX_MEMBERS = 20;
export const GUILD_FOUND_COST = 5000;
export const GUILD_RENAME_COST = 5000;
export const GUILD_RENAME_COOLDOWN_DAYS = 30;

export interface GuildMemberView {
  characterId: string;
  name: string;
  level: number;
  role: "LEADER" | "MEMBER";
  joinedAt: Date;
}

export interface GuildView {
  id: string;
  name: string;
  tag: string;
  treasuryGold: number;
  leaderCharacterId: string;
  members: GuildMemberView[];
}

async function loadGuildView(guildId: string): Promise<GuildView> {
  const guild = await prisma.guild.findUniqueOrThrow({
    where: { id: guildId },
    include: { members: { include: { character: true }, orderBy: { joinedAt: "asc" } } },
  });
  return {
    id: guild.id,
    name: guild.name,
    tag: guild.tag,
    treasuryGold: guild.treasuryGold,
    leaderCharacterId: guild.leaderCharacterId,
    members: guild.members.map((m) => ({
      characterId: m.characterId,
      name: m.character.name,
      level: m.character.level,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
  };
}

export async function getGuildForCharacter(characterId: string): Promise<GuildView | null> {
  const membership = await prisma.guildMember.findUnique({ where: { characterId } });
  if (!membership) return null;
  return loadGuildView(membership.guildId);
}

export type CreateGuildResult = { ok: true; guildId: string } | { error: string };

/** Zakłada gildię (docs/gdd/00-glowny.md: do 20 graczy; docs/gdd/11-gospodarka-i-zadania.md: koszt 5000 złota). */
export async function createGuild(characterId: string, rawName: string, rawTag: string): Promise<CreateGuildResult> {
  const nameCheck = validateGuildName(rawName);
  if (!nameCheck.ok) return { error: nameCheck.error! };
  const tagCheck = validateGuildTag(rawTag);
  if (!tagCheck.ok) return { error: tagCheck.error! };

  return prisma.$transaction(async (tx) => {
    const existing = await tx.guildMember.findUnique({ where: { characterId } });
    if (existing) return { error: "Jesteś już w gildii." };

    const character = await tx.character.findUniqueOrThrow({ where: { id: characterId } });
    if (character.goldPouch < GUILD_FOUND_COST) {
      return { error: `Potrzebujesz ${GUILD_FOUND_COST} złota, masz ${character.goldPouch}.` };
    }

    const nameKey = guildNameKey(rawName);
    const tagKey = guildTagKey(rawTag);
    const nameTaken = await tx.guild.findUnique({ where: { nameKey } });
    if (nameTaken) return { error: "Ta nazwa jest już zajęta." };
    const tagTaken = await tx.guild.findUnique({ where: { tagKey } });
    if (tagTaken) return { error: "Ten skrót jest już zajęty." };

    const newGoldPouch = character.goldPouch - GUILD_FOUND_COST;
    await tx.character.update({ where: { id: characterId }, data: { goldPouch: newGoldPouch } });
    await tx.goldEvent.create({
      data: { characterId, amount: -GUILD_FOUND_COST, balanceAfter: newGoldPouch, reason: `założenie gildii: ${rawName}` },
    });

    const guild = await tx.guild.create({
      data: { name: rawName, nameKey, tag: rawTag, tagKey, leaderCharacterId: characterId },
    });
    await tx.guildMember.create({ data: { guildId: guild.id, characterId, role: "LEADER" } });

    return { ok: true, guildId: guild.id };
  });
}

export type GuildActionResult = { ok: true } | { error: string };

export async function joinGuild(characterId: string, guildId: string): Promise<GuildActionResult> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.guildMember.findUnique({ where: { characterId } });
    if (existing) return { error: "Jesteś już w gildii." };

    const guild = await tx.guild.findUnique({ where: { id: guildId }, include: { _count: { select: { members: true } } } });
    if (!guild) return { error: "Gildia nie istnieje." };
    if (guild._count.members >= GUILD_MAX_MEMBERS) return { error: `Gildia ma już maks. ${GUILD_MAX_MEMBERS} członków.` };

    await tx.guildMember.create({ data: { guildId, characterId, role: "MEMBER" } });
    return { ok: true };
  });
}

/** Wychodzi z gildii; jeśli to ostatni przywódca sam w gildii, gildia jest rozwiązywana; inaczej przywództwo przejmuje najdłużej działający członek. */
export async function leaveGuild(characterId: string): Promise<GuildActionResult> {
  return prisma.$transaction(async (tx) => {
    const membership = await tx.guildMember.findUnique({ where: { characterId } });
    if (!membership) return { error: "Nie jesteś w żadnej gildii." };

    const remaining = await tx.guildMember.findMany({
      where: { guildId: membership.guildId, characterId: { not: characterId } },
      orderBy: { joinedAt: "asc" },
    });

    await tx.guildMember.delete({ where: { characterId } });

    if (membership.role === "LEADER") {
      if (remaining.length === 0) {
        await tx.guild.delete({ where: { id: membership.guildId } });
      } else {
        const successor = remaining[0];
        await tx.guildMember.update({ where: { characterId: successor.characterId }, data: { role: "LEADER" } });
        await tx.guild.update({ where: { id: membership.guildId }, data: { leaderCharacterId: successor.characterId } });
      }
    }

    return { ok: true };
  });
}

export async function kickMember(leaderCharacterId: string, targetCharacterId: string): Promise<GuildActionResult> {
  if (leaderCharacterId === targetCharacterId) return { error: "Użyj opcji wyjścia z gildii." };

  return prisma.$transaction(async (tx) => {
    const leaderMembership = await tx.guildMember.findUnique({ where: { characterId: leaderCharacterId } });
    if (!leaderMembership || leaderMembership.role !== "LEADER") return { error: "Tylko przywódca może wyrzucać członków." };

    const targetMembership = await tx.guildMember.findUnique({ where: { characterId: targetCharacterId } });
    if (!targetMembership || targetMembership.guildId !== leaderMembership.guildId) {
      return { error: "Ten gracz nie jest w Twojej gildii." };
    }

    await tx.guildMember.delete({ where: { characterId: targetCharacterId } });
    return { ok: true };
  });
}

export async function renameGuild(leaderCharacterId: string, rawName: string): Promise<GuildActionResult> {
  const nameCheck = validateGuildName(rawName);
  if (!nameCheck.ok) return { error: nameCheck.error! };

  return prisma.$transaction(async (tx) => {
    const membership = await tx.guildMember.findUnique({ where: { characterId: leaderCharacterId } });
    if (!membership || membership.role !== "LEADER") return { error: "Tylko przywódca może zmienić nazwę." };

    const guild = await tx.guild.findUniqueOrThrow({ where: { id: membership.guildId } });
    if (guild.nameChangedAt) {
      const nextAllowed = new Date(guild.nameChangedAt.getTime() + GUILD_RENAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
      if (nextAllowed > new Date()) {
        return { error: `Nazwę można zmienić znowu ${nextAllowed.toLocaleDateString("pl-PL")}.` };
      }
    }
    if (guild.treasuryGold < GUILD_RENAME_COST) {
      return { error: `Skarbiec potrzebuje ${GUILD_RENAME_COST} złota, ma ${guild.treasuryGold}.` };
    }

    const nameKey = guildNameKey(rawName);
    const taken = await tx.guild.findUnique({ where: { nameKey } });
    if (taken && taken.id !== guild.id) return { error: "Ta nazwa jest już zajęta." };

    await tx.guild.update({
      where: { id: guild.id },
      data: { name: rawName, nameKey, treasuryGold: guild.treasuryGold - GUILD_RENAME_COST, nameChangedAt: new Date() },
    });
    return { ok: true };
  });
}

export type TreasuryResult = { ok: true; goldPouch: number; treasuryGold: number } | { error: string };

export async function depositToTreasury(characterId: string, amount: number): Promise<TreasuryResult> {
  if (!Number.isInteger(amount) || amount <= 0) return { error: "Nieprawidłowa ilość." };

  return prisma.$transaction(async (tx) => {
    const membership = await tx.guildMember.findUnique({ where: { characterId } });
    if (!membership) return { error: "Nie jesteś w żadnej gildii." };

    const character = await tx.character.findUniqueOrThrow({ where: { id: characterId } });
    if (character.goldPouch < amount) return { error: `Masz tylko ${character.goldPouch} złota.` };

    const newGoldPouch = character.goldPouch - amount;
    await tx.character.update({ where: { id: characterId }, data: { goldPouch: newGoldPouch } });
    const guild = await tx.guild.update({
      where: { id: membership.guildId },
      data: { treasuryGold: { increment: amount } },
    });
    await tx.goldEvent.create({
      data: { characterId, amount: -amount, balanceAfter: newGoldPouch, reason: "wpłata do skarbca gildii" },
    });

    return { ok: true, goldPouch: newGoldPouch, treasuryGold: guild.treasuryGold };
  });
}

export async function withdrawFromTreasury(leaderCharacterId: string, amount: number): Promise<TreasuryResult> {
  if (!Number.isInteger(amount) || amount <= 0) return { error: "Nieprawidłowa ilość." };

  return prisma.$transaction(async (tx) => {
    const membership = await tx.guildMember.findUnique({ where: { characterId: leaderCharacterId } });
    if (!membership || membership.role !== "LEADER") return { error: "Tylko przywódca może wypłacać ze skarbca." };

    const guild = await tx.guild.findUniqueOrThrow({ where: { id: membership.guildId } });
    if (guild.treasuryGold < amount) return { error: `Skarbiec ma tylko ${guild.treasuryGold} złota.` };

    const character = await tx.character.findUniqueOrThrow({ where: { id: leaderCharacterId } });
    const newGoldPouch = character.goldPouch + amount;
    await tx.character.update({ where: { id: leaderCharacterId }, data: { goldPouch: newGoldPouch } });
    await tx.guild.update({ where: { id: guild.id }, data: { treasuryGold: { decrement: amount } } });
    await tx.goldEvent.create({
      data: { characterId: leaderCharacterId, amount, balanceAfter: newGoldPouch, reason: "wypłata ze skarbca gildii" },
    });

    return { ok: true, goldPouch: newGoldPouch, treasuryGold: guild.treasuryGold - amount };
  });
}

export interface GuildListEntry {
  id: string;
  name: string;
  tag: string;
  memberCount: number;
}

export async function listGuilds(server: string): Promise<GuildListEntry[]> {
  const guilds = await prisma.guild.findMany({
    where: { leaderCharacter: { server } },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  return guilds.map((g) => ({ id: g.id, name: g.name, tag: g.tag, memberCount: g._count.members }));
}

export { loadGuildView as getGuildView };
