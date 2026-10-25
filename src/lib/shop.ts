import "server-only";

import { QUALITY_MULTIPLIER } from "@/game/combat/equipment";
import { MAX_STAMINA, regenerateStamina } from "@/game/character/stamina";
import { MAX_STAMINA_POTIONS_PER_DAY, getPotion, priceFor } from "@/game/data/potions";
import { generateShopItem } from "@/game/items/generateItem";
import type { ItemSlot, ItemQuality } from "@/generated/prisma/client";

import { checkDeityQuests, recordInjuryHealedSignal } from "./deityQuests";
import { prisma } from "./prisma";

/** Cena kupna NPC = 8 × poziom × mnożnik jakości (docs/gdd/08-ekwipunek.md:244). UNIQUE nie jest w tabeli GDD – do przeglądu, traktowane jak LEGENDARY. */
export function npcBuyPrice(level: number, quality: ItemQuality): number {
  const multiplier = quality === "UNIQUE" ? QUALITY_MULTIPLIER.LEGENDARY : QUALITY_MULTIPLIER[quality];
  return 8 * level * multiplier;
}

/** Cena sprzedaży NPC = 25% ceny kupna (docs/gdd/08-ekwipunek.md:244). */
export function npcSellPrice(level: number, quality: ItemQuality): number {
  return Math.round(npcBuyPrice(level, quality) * 0.25);
}

export type ShopResult = { ok: true; goldPouch: number; quantity: number } | { error: string };

/** Kupuje mikstury za złoto z sakwy (docs/gdd/11-gospodarka-i-zadania.md, "Mikstury i sklep"). */
export async function buyPotion(characterId: string, potionKey: string, quantity: number): Promise<ShopResult> {
  const potion = getPotion(potionKey);
  if (!potion) return { error: "Nieznana mikstura." };
  if (!Number.isInteger(quantity) || quantity <= 0) return { error: "Nieprawidłowa ilość." };

  return prisma.$transaction(async (tx) => {
    const character = await tx.character.findUniqueOrThrow({ where: { id: characterId } });
    const cost = priceFor(potionKey, character.level) * quantity;

    if (character.goldPouch < cost) {
      return { error: `Potrzebujesz ${cost} złota, masz ${character.goldPouch}.` };
    }

    const newGoldPouch = character.goldPouch - cost;
    await tx.character.update({ where: { id: characterId }, data: { goldPouch: newGoldPouch } });

    const consumable = await tx.consumable.upsert({
      where: { characterId_kind: { characterId, kind: potionKey } },
      create: { characterId, kind: potionKey, quantity },
      update: { quantity: { increment: quantity } },
    });

    await tx.goldEvent.create({
      data: { characterId, amount: -cost, balanceAfter: newGoldPouch, reason: `sklep: ${potion.name} ×${quantity}` },
    });

    return { ok: true, goldPouch: newGoldPouch, quantity: consumable.quantity };
  });
}

export type BuyEquipmentResult = { ok: true; goldPouch: number; price: number; itemId: string } | { error: string };

/** Kupuje zwykły (COMMON) przedmiot NPC dla danego slotu, na poziom postaci (docs/gdd/08-ekwipunek.md: "mikstury i zwykłe przedmioty"). */
export async function buyEquipmentFromNpc(characterId: string, slot: ItemSlot): Promise<BuyEquipmentResult> {
  return prisma.$transaction(async (tx) => {
    const character = await tx.character.findUniqueOrThrow({ where: { id: characterId } });
    const price = npcBuyPrice(character.level, "COMMON");
    if (character.goldPouch < price) {
      return { error: `Potrzebujesz ${price} złota, masz ${character.goldPouch}.` };
    }

    const generated = generateShopItem(slot, character.level, character.class);
    const newGoldPouch = character.goldPouch - price;
    await tx.character.update({ where: { id: characterId }, data: { goldPouch: newGoldPouch } });
    await tx.goldEvent.create({
      data: { characterId, amount: -price, balanceAfter: newGoldPouch, reason: `sklep: zakup ${generated.name}` },
    });

    const item = await tx.item.create({
      data: {
        characterId,
        name: generated.name,
        slot: generated.slot,
        level: generated.level,
        quality: generated.quality,
        forClass: generated.forClass,
        damageMin: generated.damageMin,
        damageMax: generated.damageMax,
        armor: generated.armor,
        traits: JSON.parse(JSON.stringify(generated.affixes)),
        location: "BACKPACK",
      },
    });
    await tx.itemEvent.create({ data: { itemId: item.id, characterId, type: "CREATED", reason: "kupiono w sklepie NPC" } });

    return { ok: true, goldPouch: newGoldPouch, price, itemId: item.id };
  });
}

export type SellItemResult = { ok: true; goldPouch: number; price: number } | { error: string };

/** Sprzedaje ekwipunek NPC za 25% ceny kupna (docs/gdd/08-ekwipunek.md:244). */
export async function sellItemToNpc(characterId: string, itemId: string): Promise<SellItemResult> {
  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({ where: { id: itemId } });
    if (!item || item.characterId !== characterId) return { error: "Nie masz tego przedmiotu." };
    if (item.locked) return { error: "Przedmiot jest zablokowany kłódką." };
    if (item.location !== "BACKPACK" && item.location !== "STASH") {
      return { error: "Zdejmij przedmiot przed sprzedażą." };
    }

    const price = npcSellPrice(item.level, item.quality);
    const character = await tx.character.findUniqueOrThrow({ where: { id: characterId } });
    const newGoldPouch = character.goldPouch + price;

    await tx.character.update({ where: { id: characterId }, data: { goldPouch: newGoldPouch } });
    await tx.goldEvent.create({
      data: { characterId, amount: price, balanceAfter: newGoldPouch, reason: `sklep: sprzedaż ${item.name}` },
    });
    await tx.itemEvent.create({ data: { itemId, characterId, type: "SOLD", reason: "sprzedano NPC" } });
    await tx.item.delete({ where: { id: itemId } });

    return { ok: true, goldPouch: newGoldPouch, price };
  });
}

export type UsePotionResult =
  | { ok: true; effect: "injury-cured" | "stamina" }
  | { error: string };

/** Zużywa miksturę INSTANT od razu, poza walką. */
export async function consumeInstantPotion(characterId: string, potionKey: string): Promise<UsePotionResult> {
  const potion = getPotion(potionKey);
  if (!potion || potion.kind !== "INSTANT") return { error: "Tej mikstury nie można użyć od razu." };

  return prisma.$transaction(async (tx) => {
    const owned = await tx.consumable.findUnique({ where: { characterId_kind: { characterId, kind: potionKey } } });
    if (!owned || owned.quantity <= 0) return { error: "Nie masz tej mikstury." };

    const character = await tx.character.findUniqueOrThrow({ where: { id: characterId } });

    if (potionKey === "mikstura-uzdrowienia") {
      if (!character.injuredUntil || character.injuredUntil <= new Date()) {
        return { error: "Nie jesteś ranny." };
      }
      await tx.character.update({ where: { id: characterId }, data: { injuredUntil: null } });
      await tx.consumable.update({ where: { id: owned.id }, data: { quantity: { decrement: 1 } } });
      await recordInjuryHealedSignal(tx, characterId);
      await checkDeityQuests(tx, characterId, character.level, character.deity, {
        strength: character.strength,
        dexterity: character.dexterity,
        vitality: character.vitality,
        intellect: character.intellect,
      });
      return { ok: true, effect: "injury-cured" };
    }

    if (potionKey === "napoj-wytrwalosci") {
      const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
      const usedToday = await tx.gameEvent.count({
        where: { characterId, type: "napój wytrwałości", createdAt: { gte: today } },
      });
      if (usedToday >= MAX_STAMINA_POTIONS_PER_DAY) {
        return { error: `Już wypiłeś dziś ${MAX_STAMINA_POTIONS_PER_DAY} napoje wytrwałości.` };
      }

      const now = new Date();
      const regen = regenerateStamina({ stamina: character.stamina, staminaUpdatedAt: character.staminaUpdatedAt }, now);
      const newStamina = Math.min(MAX_STAMINA, regen.stamina + 30);
      await tx.character.update({
        where: { id: characterId },
        data: { stamina: newStamina, staminaUpdatedAt: regen.staminaUpdatedAt },
      });
      await tx.consumable.update({ where: { id: owned.id }, data: { quantity: { decrement: 1 } } });
      await tx.gameEvent.create({ data: { characterId, type: "napój wytrwałości", details: {} } });
      return { ok: true, effect: "stamina" };
    }

    return { error: "Nieobsługiwana mikstura." };
  });
}
