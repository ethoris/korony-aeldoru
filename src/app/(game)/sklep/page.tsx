import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { POTIONS, priceFor } from "@/game/data/potions";
import { getCharacterForUser } from "@/lib/expeditions";
import { prisma } from "@/lib/prisma";
import { npcBuyPrice } from "@/lib/shop";
import type { ItemSlot } from "@/generated/prisma/client";

import { ShopClient } from "./ShopClient";

const EQUIPMENT_SLOTS: ItemSlot[] = ["WEAPON", "OFFHAND", "HELMET", "ARMOR", "GLOVES", "BOOTS", "AMULET", "RING"];

export const instant = false;

export default async function ShopPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const character = await getCharacterForUser(session.user.id);
  if (!character) redirect("/character/new");

  const consumables = await prisma.consumable.findMany({ where: { characterId: character.id } });
  const ownedByKind = new Map(consumables.map((c) => [c.kind, c.quantity]));

  const potions = Object.values(POTIONS).map((p) => ({
    key: p.key,
    name: p.name,
    kind: p.kind,
    effectText: p.effectText,
    price: priceFor(p.key, character.level),
    owned: ownedByKind.get(p.key) ?? 0,
  }));

  const equipmentPrice = npcBuyPrice(character.level, "COMMON");

  return (
    <main className="flex flex-1 justify-center p-4">
      <ShopClient
        potions={potions}
        equipmentSlots={EQUIPMENT_SLOTS}
        equipmentPrice={equipmentPrice}
        goldPouch={character.goldPouch}
        injured={Boolean(character.injuredUntil && character.injuredUntil > new Date())}
      />
    </main>
  );
}
