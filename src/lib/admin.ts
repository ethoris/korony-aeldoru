import "server-only";

import type { Class, ItemQuality, ItemSlot } from "@/generated/prisma/client";

import { prisma } from "./prisma";

export type AdminRole = "ADMIN" | "MODERATOR";

async function requireRole(userId: string, roles: AdminRole[]): Promise<{ ok: true } | { error: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !roles.includes(user.role as AdminRole)) return { error: "Brak uprawnień." };
  return { ok: true };
}

async function logAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  reason: string,
  before?: unknown,
  after?: unknown,
): Promise<void> {
  await prisma.adminAction.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      reason,
      before: before === undefined ? undefined : JSON.parse(JSON.stringify(before)),
      after: after === undefined ? undefined : JSON.parse(JSON.stringify(after)),
    },
  });
}

export interface PlayerSearchResult {
  characterId: string;
  userId: string;
  email: string;
  name: string;
  level: number;
  goldPouch: number;
  role: string;
}

/** Wyszukiwarka graczy po imieniu, e-mailu lub ID (docs/gdd/13-technika.md). */
export async function searchPlayers(query: string): Promise<PlayerSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const characters = await prisma.character.findMany({
    where: {
      OR: [
        { id: trimmed },
        { name: { contains: trimmed, mode: "insensitive" } },
        { user: { email: { contains: trimmed, mode: "insensitive" } } },
      ],
    },
    include: { user: true },
    take: 20,
  });

  return characters.map((c) => ({
    characterId: c.id,
    userId: c.userId,
    email: c.user.email,
    name: c.name,
    level: c.level,
    goldPouch: c.goldPouch,
    role: c.user.role,
  }));
}

export interface PlayerProfile {
  characterId: string;
  userId: string;
  email: string;
  name: string;
  level: number;
  experience: number;
  goldPouch: number;
  race: string;
  class: string;
  deity: string;
  fame: number;
  injuredUntil: Date | null;
  ageConfirmed: boolean;
  createdAt: Date;
  equippedItems: { id: string; name: string; slot: string; quality: string; level: number }[];
  recentBattleReports: { id: string; opponentKey: string; result: string; createdAt: Date }[];
  recentGoldEvents: { id: string; amount: number; balanceAfter: number; reason: string; createdAt: Date }[];
  recentItemEvents: { id: string; itemId: string; type: string; reason: string | null; createdAt: Date }[];
  nameHistory: { oldName: string; newName: string; changedAt: Date; forcedByMod: boolean }[];
  activeSanctions: { type: string; reason: string; expiresAt: Date | null; createdAt: Date }[];
}

/** Historia gracza: raporty, ruchy złota, przedmioty, zmiany imienia (docs/gdd/13-technika.md). Login_log jeszcze nie istnieje. */
export async function getPlayerProfile(characterId: string): Promise<PlayerProfile | null> {
  const character = await prisma.character.findUnique({ where: { id: characterId }, include: { user: true } });
  if (!character) return null;

  const [equipped, battleReports, goldEvents, itemEvents, nameHistory, sanctions] = await Promise.all([
    prisma.item.findMany({ where: { characterId, location: "EQUIPPED" } }),
    prisma.battleReport.findMany({ where: { characterId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.goldEvent.findMany({ where: { characterId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.itemEvent.findMany({ where: { characterId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.nameHistoryEntry.findMany({ where: { characterId }, orderBy: { changedAt: "desc" } }),
    prisma.sanction.findMany({
      where: { characterId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    characterId: character.id,
    userId: character.userId,
    email: character.user.email,
    name: character.name,
    level: character.level,
    experience: character.experience,
    goldPouch: character.goldPouch,
    race: character.race,
    class: character.class,
    deity: character.deity,
    fame: character.fame,
    injuredUntil: character.injuredUntil,
    ageConfirmed: character.user.ageConfirmed,
    createdAt: character.createdAt,
    equippedItems: equipped.map((i) => ({ id: i.id, name: i.name, slot: i.slot, quality: i.quality, level: i.level })),
    recentBattleReports: battleReports.map((b) => ({ id: b.id, opponentKey: b.opponentKey, result: b.result, createdAt: b.createdAt })),
    recentGoldEvents: goldEvents.map((g) => ({ id: g.id, amount: g.amount, balanceAfter: g.balanceAfter, reason: g.reason, createdAt: g.createdAt })),
    recentItemEvents: itemEvents.map((e) => ({ id: e.id, itemId: e.itemId, type: e.type, reason: e.reason, createdAt: e.createdAt })),
    nameHistory: nameHistory.map((n) => ({ oldName: n.oldName, newName: n.newName, changedAt: n.changedAt, forcedByMod: n.forcedByMod })),
    activeSanctions: sanctions.map((s) => ({ type: s.type, reason: s.reason, expiresAt: s.expiresAt, createdAt: s.createdAt })),
  };
}

export type EditCharacterResult = { ok: true } | { error: string };

export interface EditCharacterChanges {
  level?: number;
  experience?: number;
  goldPouch?: number;
  freePoints?: number;
  stamina?: number;
}

/** Edycja postaci – tylko ADMIN, zawsze z powodem (docs/gdd/13-technika.md). */
export async function editCharacter(
  adminUserId: string,
  characterId: string,
  changes: EditCharacterChanges,
  reason: string,
): Promise<EditCharacterResult> {
  const access = await requireRole(adminUserId, ["ADMIN"]);
  if ("error" in access) return access;
  if (!reason.trim()) return { error: "Podaj powód zmiany." };

  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character) return { error: "Nie znaleziono postaci." };

  const before = {
    level: character.level,
    experience: character.experience,
    goldPouch: character.goldPouch,
    freePoints: character.freePoints,
    stamina: character.stamina,
  };

  await prisma.character.update({ where: { id: characterId }, data: changes });
  await logAction(adminUserId, "EDIT_CHARACTER", "character", characterId, reason, before, changes);

  if (changes.goldPouch !== undefined) {
    await prisma.goldEvent.create({
      data: {
        characterId,
        amount: changes.goldPouch - character.goldPouch,
        balanceAfter: changes.goldPouch,
        reason: `panel admina: ${reason}`,
      },
    });
  }

  return { ok: true };
}

export type GrantItemResult = { ok: true; itemId: string } | { error: string };

export interface GrantItemInput {
  name: string;
  slot: ItemSlot;
  level: number;
  quality: ItemQuality;
  forClass: Class;
  damageMin?: number;
  damageMax?: number;
  armor?: number;
}

/** Zwrot/przyznanie przedmiotu po błędzie gry – tylko ADMIN (docs/gdd/13-technika.md). */
export async function grantItem(adminUserId: string, characterId: string, item: GrantItemInput, reason: string): Promise<GrantItemResult> {
  const access = await requireRole(adminUserId, ["ADMIN"]);
  if ("error" in access) return access;
  if (!reason.trim()) return { error: "Podaj powód przyznania przedmiotu." };

  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character) return { error: "Nie znaleziono postaci." };

  const created = await prisma.item.create({
    data: {
      characterId,
      name: item.name,
      slot: item.slot,
      level: item.level,
      quality: item.quality,
      forClass: item.forClass,
      damageMin: item.damageMin ?? null,
      damageMax: item.damageMax ?? null,
      armor: item.armor ?? null,
      location: "BACKPACK",
    },
  });
  await prisma.itemEvent.create({
    data: { itemId: created.id, characterId, type: "RESTORED", reason: `panel admina: ${reason}` },
  });
  await logAction(adminUserId, "GRANT_ITEM", "item", created.id, reason, undefined, item);

  return { ok: true, itemId: created.id };
}

export type MaintenanceResult = { ok: true } | { error: string };

export async function getMaintenanceMode(): Promise<{ enabled: boolean; message: string | null }> {
  const settings = await prisma.gameSettings.findUnique({ where: { id: 1 } });
  return { enabled: settings?.maintenanceMode ?? false, message: settings?.maintenanceMessage ?? null };
}

/** Tryb przerwy technicznej – tylko ADMIN (docs/gdd/13-technika.md). Nie doliczamy jeszcze automatycznie czasu przerwy do wypraw/budów w trakcie – do zrobienia osobno. */
export async function setMaintenanceMode(adminUserId: string, enabled: boolean, message: string, reason: string): Promise<MaintenanceResult> {
  const access = await requireRole(adminUserId, ["ADMIN"]);
  if ("error" in access) return access;
  if (!reason.trim()) return { error: "Podaj powód." };

  await prisma.gameSettings.upsert({
    where: { id: 1 },
    create: { id: 1, maintenanceMode: enabled, maintenanceMessage: message || null },
    update: { maintenanceMode: enabled, maintenanceMessage: message || null },
  });
  await logAction(adminUserId, enabled ? "MAINTENANCE_ON" : "MAINTENANCE_OFF", "game_settings", "1", reason);

  return { ok: true };
}

export async function listAdminActions(limit = 50) {
  const actions = await prisma.adminAction.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { admin: true },
  });
  return actions.map((a) => ({
    id: a.id,
    adminEmail: a.admin.email,
    action: a.action,
    targetType: a.targetType,
    targetId: a.targetId,
    reason: a.reason,
    createdAt: a.createdAt,
  }));
}

export { requireRole };
