import "server-only";

import type { Element } from "@/game/combat/types";
import {
  MAX_UPGRADE_LEVEL,
  RUNE_COST,
  RUNE_ELEMENTS,
  RUNE_KUZNIA_LEVEL,
  UPGRADABLE_SLOTS,
  upgradeCost,
  upgradeSuccessChance,
  upgradeTier,
} from "@/game/items/upgrade";

import { getFortressView } from "./fortress";
import { prisma } from "./prisma";

function kuzniaLevel(buildingLevels: Record<string, number> | undefined): number {
  return buildingLevels?.KUZNIA ?? 0;
}

export type UpgradeItemResult =
  | { ok: true; success: boolean; newLevel: number; chance: number }
  | { error: string };

/** Ulepsza przedmiot +1 (docs/gdd/08-ekwipunek.md). Wymaga Kuźni w twierdzy. */
export async function upgradeItem(characterId: string, itemId: string): Promise<UpgradeItemResult> {
  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({ where: { id: itemId } });
    if (!item || item.characterId !== characterId) return { error: "Nie masz tego przedmiotu." };
    if (!UPGRADABLE_SLOTS.includes(item.slot)) return { error: "Tego przedmiotu nie można ulepszyć." };
    if (item.upgrade >= MAX_UPGRADE_LEVEL) return { error: `Przedmiot ma już maksymalne ulepszenie +${MAX_UPGRADE_LEVEL}.` };

    const fortress = await tx.fortress.findUnique({ where: { characterId } });
    if (!fortress) return { error: "Nie masz jeszcze twierdzy z Kuźnią." };

    const targetLevel = item.upgrade + 1;
    const tier = upgradeTier(targetLevel);
    if (!tier) return { error: "Nieprawidłowy poziom ulepszenia." };

    const level = kuzniaLevel(fortress.buildingLevels as Record<string, number>);
    if (level < tier.kuzniaLevelRequired) {
      return { error: `Potrzebujesz Kuźni poziomu ${tier.kuzniaLevelRequired}, masz ${level}.` };
    }

    const cost = upgradeCost(item.level, targetLevel);
    const character = await tx.character.findUniqueOrThrow({ where: { id: characterId } });

    if (fortress.iron < cost.iron) return { error: `Potrzebujesz ${cost.iron} żelaza, masz ${fortress.iron}.` };
    if (fortress.mana < cost.mana) return { error: `Potrzebujesz ${cost.mana} many, masz ${fortress.mana}.` };
    if (character.goldPouch < cost.gold) return { error: `Potrzebujesz ${cost.gold} złota, masz ${character.goldPouch}.` };

    await tx.fortress.update({
      where: { characterId },
      data: { iron: fortress.iron - cost.iron, mana: fortress.mana - cost.mana },
    });
    const newGoldPouch = character.goldPouch - cost.gold;
    await tx.character.update({ where: { id: characterId }, data: { goldPouch: newGoldPouch } });
    if (cost.gold > 0) {
      await tx.goldEvent.create({
        data: { characterId, amount: -cost.gold, balanceAfter: newGoldPouch, reason: `kuźnia: ulepszenie +${targetLevel}` },
      });
    }

    const chance = upgradeSuccessChance(targetLevel, item.upgradeFailStreak);
    const success = Math.random() * 100 < chance;

    if (success) {
      await tx.item.update({ where: { id: itemId }, data: { upgrade: targetLevel, upgradeFailStreak: 0 } });
    } else {
      await tx.item.update({ where: { id: itemId }, data: { upgradeFailStreak: item.upgradeFailStreak + 1 } });
    }

    await tx.itemEvent.create({
      data: {
        itemId,
        characterId,
        type: "UPGRADED",
        reason: success ? `sukces +${targetLevel} (szansa ${chance}%)` : `porażka, poziom bez zmian (szansa ${chance}%)`,
      },
    });

    return { ok: true, success, newLevel: success ? targetLevel : item.upgrade, chance };
  });
}

export type ApplyRuneResult = { ok: true; element: Element } | { error: string };

/** Nakłada runę żywiołu na broń: 30% obrażeń broni staje się tym żywiołem (docs/gdd/02-systemy-walki.md). */
export async function applyRune(characterId: string, itemId: string, element: Element): Promise<ApplyRuneResult> {
  if (!RUNE_ELEMENTS.includes(element)) return { error: "Nieprawidłowy żywioł." };

  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({ where: { id: itemId } });
    if (!item || item.characterId !== characterId) return { error: "Nie masz tego przedmiotu." };
    if (item.slot !== "WEAPON") return { error: "Runę można nałożyć tylko na broń." };

    const fortress = await tx.fortress.findUnique({ where: { characterId } });
    if (!fortress) return { error: "Nie masz jeszcze twierdzy z Kuźnią." };

    const level = kuzniaLevel(fortress.buildingLevels as Record<string, number>);
    if (level < RUNE_KUZNIA_LEVEL) {
      return { error: `Potrzebujesz Kuźni poziomu ${RUNE_KUZNIA_LEVEL}, masz ${level}.` };
    }
    if (fortress.iron < RUNE_COST.iron || fortress.mana < RUNE_COST.mana) {
      return { error: `Potrzebujesz ${RUNE_COST.iron} żelaza i ${RUNE_COST.mana} many.` };
    }

    await tx.fortress.update({
      where: { characterId },
      data: { iron: fortress.iron - RUNE_COST.iron, mana: fortress.mana - RUNE_COST.mana },
    });

    await tx.item.update({ where: { id: itemId }, data: { rune: element } });
    await tx.itemEvent.create({
      data: { itemId, characterId, type: "RUNE_APPLIED", reason: `runa: ${element} (wymiana niszczy starą)` },
    });

    return { ok: true, element };
  });
}

export { getFortressView };
