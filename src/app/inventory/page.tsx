import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getCharacterForUser } from "@/lib/expeditions";
import { prisma } from "@/lib/prisma";

import { InventoryClient } from "./InventoryClient";

// Cała strona zależy od sesji – nie da się jej prerenderować jako statyczny shell.
export const instant = false;

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const character = await getCharacterForUser(session.user.id);
  if (!character) redirect("/character/new");

  const items = await prisma.item.findMany({
    where: { characterId: character.id },
    orderBy: { createdAt: "desc" },
  });

  const serialized = items.map((item) => ({
    id: item.id,
    name: item.name,
    slot: item.slot,
    level: item.level,
    quality: item.quality,
    forClass: item.forClass,
    damageMin: item.damageMin,
    damageMax: item.damageMax,
    armor: item.armor,
    traits: item.traits as unknown as Array<{ key: string; value: number; label: string }>,
    location: item.location,
    locked: item.locked,
  }));

  return (
    <main className="flex flex-1 justify-center p-4">
      <InventoryClient items={serialized} characterClass={character.class} />
    </main>
  );
}
