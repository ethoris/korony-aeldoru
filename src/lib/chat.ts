import "server-only";

import { CHAT_RATE_LIMIT_MS, containsLink, validateChatMessage } from "@/lib/validation/chatMessage";

import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";

export const CHAT_UNLOCK_LEVEL = 5;
export const CHAT_HISTORY_LIMIT = 50;
export const REPORT_CONTEXT_SIZE = 20;

export type ChatChannelKey = "GENERAL" | "TRADE" | "GUILD" | "DM";

async function activeMute(characterId: string): Promise<string | null> {
  const mute = await prisma.sanction.findFirst({
    where: { characterId, type: "MUTE", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    orderBy: { createdAt: "desc" },
  });
  if (!mute) return null;
  return mute.expiresAt ? `Masz wyciszenie do ${mute.expiresAt.toLocaleString("pl-PL")}.` : "Masz trwałe wyciszenie.";
}

export type PostMessageResult = { ok: true; messageId: string } | { error: string };

/** Wysyła wiadomość na czacie (docs/gdd/12-spolecznosc.md). */
export async function postMessage(
  characterId: string,
  channel: ChatChannelKey,
  content: string,
  opts: { recipientCharacterId?: string } = {},
): Promise<PostMessageResult> {
  return prisma.$transaction(async (tx) => {
    const character = await tx.character.findUniqueOrThrow({ where: { id: characterId } });

    const muteReason = await activeMute(characterId);
    if (muteReason) return { error: muteReason };

    if ((channel === "GENERAL" || channel === "TRADE") && character.level < CHAT_UNLOCK_LEVEL) {
      return { error: `Kanał odblokowany od poziomu ${CHAT_UNLOCK_LEVEL}.` };
    }

    let guildId: string | null = null;
    if (channel === "GUILD") {
      const membership = await tx.guildMember.findUnique({ where: { characterId } });
      if (!membership) return { error: "Nie jesteś w żadnej gildii." };
      guildId = membership.guildId;
    }

    let recipientCharacterId: string | null = null;
    if (channel === "DM") {
      recipientCharacterId = opts.recipientCharacterId ?? null;
      if (!recipientCharacterId) return { error: "Podaj odbiorcę wiadomości." };
      if (recipientCharacterId === characterId) return { error: "Nie możesz pisać do samego siebie." };
      const recipient = await tx.character.findUnique({ where: { id: recipientCharacterId } });
      if (!recipient || recipient.server !== character.server) return { error: "Odbiorca nie istnieje na tym serwerze." };
    }

    const last = await tx.chatMessage.findFirst({
      where: { authorCharacterId: characterId },
      orderBy: { createdAt: "desc" },
    });
    if (last && Date.now() - last.createdAt.getTime() < CHAT_RATE_LIMIT_MS) {
      return { error: "Piszesz za szybko, zaczekaj chwilę." };
    }

    const check = validateChatMessage(content, channel === "GUILD");
    if (!check.ok) return { error: check.error! };

    const message = await tx.chatMessage.create({
      data: { channel, authorCharacterId: characterId, guildId, recipientCharacterId, content: content.trim() },
    });

    return { ok: true, messageId: message.id };
  });
}

export interface ChatMessageView {
  id: string;
  authorCharacterId: string;
  authorName: string;
  content: string;
  createdAt: Date;
  containsLink: boolean;
}

/** Pobiera historię kanału, z wyfiltrowanymi wiadomościami zablokowanych nadawców (docs/gdd/12-spolecznosc.md). */
export async function listMessages(
  characterId: string,
  channel: ChatChannelKey,
  opts: { guildId?: string; withCharacterId?: string } = {},
): Promise<ChatMessageView[]> {
  const blocks = await prisma.playerBlock.findMany({ where: { blockerCharacterId: characterId } });
  const blockedIds = new Set(blocks.map((b) => b.blockedCharacterId));

  const where: Prisma.ChatMessageWhereInput =
    channel === "GUILD"
      ? { channel: "GUILD", guildId: opts.guildId }
      : channel === "DM"
        ? {
            channel: "DM",
            OR: [
              { authorCharacterId: characterId, recipientCharacterId: opts.withCharacterId },
              { authorCharacterId: opts.withCharacterId, recipientCharacterId: characterId },
            ],
          }
        : { channel };

  const messages = await prisma.chatMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: CHAT_HISTORY_LIMIT,
    include: { authorCharacter: true },
  });

  return messages
    .filter((m) => !blockedIds.has(m.authorCharacterId))
    .map((m) => ({
      id: m.id,
      authorCharacterId: m.authorCharacterId,
      authorName: m.authorCharacter.name,
      content: m.content,
      createdAt: m.createdAt,
      containsLink: containsLink(m.content),
    }))
    .reverse();
}

export type BlockResult = { ok: true } | { error: string };

export async function blockPlayer(characterId: string, targetCharacterId: string): Promise<BlockResult> {
  if (characterId === targetCharacterId) return { error: "Nie możesz zablokować samego siebie." };
  await prisma.playerBlock.upsert({
    where: { blockerCharacterId_blockedCharacterId: { blockerCharacterId: characterId, blockedCharacterId: targetCharacterId } },
    create: { blockerCharacterId: characterId, blockedCharacterId: targetCharacterId },
    update: {},
  });
  return { ok: true };
}

export async function unblockPlayer(characterId: string, targetCharacterId: string): Promise<BlockResult> {
  await prisma.playerBlock.deleteMany({ where: { blockerCharacterId: characterId, blockedCharacterId: targetCharacterId } });
  return { ok: true };
}

export async function listBlocked(characterId: string): Promise<{ characterId: string; name: string }[]> {
  const blocks = await prisma.playerBlock.findMany({
    where: { blockerCharacterId: characterId },
    include: { blockedCharacter: true },
  });
  return blocks.map((b) => ({ characterId: b.blockedCharacterId, name: b.blockedCharacter.name }));
}

export type ReportResult = { ok: true; reportId: string } | { error: string };

/** Zgłoszenie gracza z kontekstem ostatnich 20 wiadomości kanału (docs/gdd/12-spolecznosc.md). */
export async function reportPlayer(
  reporterCharacterId: string,
  targetCharacterId: string,
  reason: string,
  channel: ChatChannelKey,
  opts: { guildId?: string; withCharacterId?: string } = {},
): Promise<ReportResult> {
  if (reporterCharacterId === targetCharacterId) return { error: "Nie możesz zgłosić samego siebie." };
  if (!reason.trim()) return { error: "Podaj powód zgłoszenia." };

  const context = await listMessages(reporterCharacterId, channel, opts);
  const snapshot = context.slice(-REPORT_CONTEXT_SIZE).map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));

  const report = await prisma.report.create({
    data: { reporterCharacterId, targetCharacterId, reason: reason.trim(), contextSnapshot: snapshot },
  });
  return { ok: true, reportId: report.id };
}

export type SanctionResult = { ok: true } | { error: string };

/** Nakłada karę (docs/gdd/12-spolecznosc.md) – tylko moderator/admin. */
export async function applySanction(
  moderatorUserId: string,
  characterId: string,
  type: "MUTE" | "TRADE_BAN" | "ACCOUNT_BAN",
  reason: string,
  durationHours: number | null,
): Promise<SanctionResult> {
  const moderator = await prisma.user.findUnique({ where: { id: moderatorUserId } });
  if (!moderator || (moderator.role !== "MODERATOR" && moderator.role !== "ADMIN")) {
    return { error: "Tylko moderator lub admin może nakładać kary." };
  }
  if (!reason.trim()) return { error: "Podaj powód kary." };

  const expiresAt = durationHours ? new Date(Date.now() + durationHours * 60 * 60 * 1000) : null;
  await prisma.sanction.create({
    data: { characterId, type, reason: reason.trim(), expiresAt, createdByUserId: moderatorUserId },
  });
  return { ok: true };
}

export async function listReports(): Promise<
  { id: string; reporterName: string; targetName: string; reason: string; resolved: boolean; createdAt: Date }[]
> {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { reporterCharacter: true, targetCharacter: true },
  });
  return reports.map((r) => ({
    id: r.id,
    reporterName: r.reporterCharacter.name,
    targetName: r.targetCharacter.name,
    reason: r.reason,
    resolved: r.resolved,
    createdAt: r.createdAt,
  }));
}

export async function resolveReport(moderatorUserId: string, reportId: string, resolution: string): Promise<SanctionResult> {
  const moderator = await prisma.user.findUnique({ where: { id: moderatorUserId } });
  if (!moderator || (moderator.role !== "MODERATOR" && moderator.role !== "ADMIN")) {
    return { error: "Tylko moderator lub admin może rozwiązywać zgłoszenia." };
  }
  await prisma.report.update({ where: { id: reportId }, data: { resolved: true, resolution, resolvedByUserId: moderatorUserId } });
  return { ok: true };
}
