import "server-only";

import { MAX_STAMINA, regenerateStamina } from "@/game/character/stamina";
import { MAX_STAMINA_POTIONS_PER_DAY, getPotion, priceFor } from "@/game/data/potions";

import { prisma } from "./prisma";

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
