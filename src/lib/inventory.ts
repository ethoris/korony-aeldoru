import "server-only";

import { prisma } from "./prisma";

export type EquipResult = { ok: true } | { error: string };

/** Zakłada przedmiot z plecaka; jeśli slot jest zajęty, zdejmuje poprzedni do plecaka. */
export async function equipItem(characterId: string, itemId: string): Promise<EquipResult> {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.characterId !== characterId) {
    return { error: "Nie znaleziono przedmiotu." };
  }
  if (item.location === "EQUIPPED") {
    return { ok: true };
  }
  if (item.locked) {
    return { error: "Przedmiot jest zablokowany kłódką." };
  }

  await prisma.$transaction(async (tx) => {
    const current = await tx.item.findFirst({
      where: { characterId, slot: item.slot, location: "EQUIPPED" },
    });
    if (current) {
      await tx.item.update({ where: { id: current.id }, data: { location: "BACKPACK" } });
      await tx.itemEvent.create({
        data: { itemId: current.id, characterId, type: "UNEQUIPPED", reason: `zastąpiony: ${item.id}` },
      });
    }

    await tx.item.update({ where: { id: item.id }, data: { location: "EQUIPPED" } });
    await tx.itemEvent.create({ data: { itemId: item.id, characterId, type: "EQUIPPED" } });
  });

  return { ok: true };
}

export async function unequipItem(characterId: string, itemId: string): Promise<EquipResult> {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.characterId !== characterId) {
    return { error: "Nie znaleziono przedmiotu." };
  }
  if (item.location !== "EQUIPPED") {
    return { ok: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.item.update({ where: { id: item.id }, data: { location: "BACKPACK" } });
    await tx.itemEvent.create({ data: { itemId: item.id, characterId, type: "UNEQUIPPED" } });
  });

  return { ok: true };
}
