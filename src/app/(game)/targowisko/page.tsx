import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getCharacterForUser } from "@/lib/expeditions";
import { listMyOffers, listOffers } from "@/lib/market";
import { prisma } from "@/lib/prisma";

import { MarketClient } from "./MarketClient";

export const instant = false;

export default async function MarketPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const character = await getCharacterForUser(session.user.id);
  if (!character) redirect("/character/new");

  const offers = await listOffers(character.server);
  const myOffers = await listMyOffers(character.id);

  const backpackItems = await prisma.item.findMany({
    where: { characterId: character.id, location: "BACKPACK", locked: false },
    select: { id: true, name: true, quality: true, level: true, templateKey: true },
  });
  const sellableItems = backpackItems.filter((i) => !i.templateKey?.includes(":"));

  return (
    <main className="flex flex-1 justify-center p-4">
      <MarketClient
        goldPouch={character.goldPouch}
        offers={offers.map((o) => ({ ...o, expiresAt: o.expiresAt.toISOString() }))}
        myOffers={myOffers.map((o) => ({ ...o, expiresAt: o.expiresAt.toISOString() }))}
        sellableItems={sellableItems}
      />
    </main>
  );
}
