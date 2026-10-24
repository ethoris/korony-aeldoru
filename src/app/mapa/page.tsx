import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UNITS, UNIT_KEYS } from "@/game/data/units";
import { getCharacterForUser } from "@/lib/expeditions";
import { getFortressView } from "@/lib/fortress";
import { SIEGE_UNLOCK_LEVEL, getMapState, getRegionLords } from "@/lib/provinces";

import { ProvincesClient } from "./ProvincesClient";

export const instant = false;

export default async function ProvincesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const character = await getCharacterForUser(session.user.id);
  if (!character) redirect("/character/new");

  const [provinces, lords] = await Promise.all([getMapState(), getRegionLords()]);
  const view = await getFortressView(character.id);
  const units = UNIT_KEYS.map((key) => ({
    key,
    name: UNITS[key].name,
    available: view?.armies.find((a) => a.unitKey === key)?.quantity ?? 0,
  }));

  return (
    <main className="flex flex-1 justify-center p-4">
      <ProvincesClient
        characterLevel={character.level}
        unlockLevel={SIEGE_UNLOCK_LEVEL}
        units={units}
        provinces={provinces.map((p) => ({
          ...p,
          protectionUntil: p.protectionUntil?.toISOString() ?? null,
          activeSiege: p.activeSiege ? { ...p.activeSiege, battleAt: p.activeSiege.battleAt.toISOString() } : null,
        }))}
        lords={lords}
      />
    </main>
  );
}
