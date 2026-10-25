import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UNITS, UNIT_KEYS } from "@/game/data/units";
import { getCharacterForUser } from "@/lib/expeditions";
import { getFortressView } from "@/lib/fortress";
import { listOpponents } from "@/lib/pvp";
import { RAID_UNLOCK_LEVEL, listRaidsFor } from "@/lib/raids";

import { RaidsClient } from "./RaidsClient";

export const instant = false;

export default async function RaidsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const character = await getCharacterForUser(session.user.id);
  if (!character) redirect("/character/new");

  const view = await getFortressView(character.id);
  const opponents = character.level >= RAID_UNLOCK_LEVEL ? await listOpponents(character.id) : [];
  const raids = await listRaidsFor(character.id);

  const units = UNIT_KEYS.map((key) => ({
    key,
    name: UNITS[key].name,
    available: view?.armies.find((a) => a.unitKey === key)?.quantity ?? 0,
  }));

  return (
    <main className="flex flex-1 justify-center p-4">
      <RaidsClient
        characterLevel={character.level}
        unlockLevel={RAID_UNLOCK_LEVEL}
        hasFortress={view !== null}
        units={units}
        opponents={opponents.map((o) => ({ id: o.id, name: o.name, level: o.level }))}
        raids={raids.map((r) => ({
          id: r.id,
          isAttacker: r.isAttacker,
          opponentName: r.opponentName,
          arrivalAt: r.arrivalAt.toISOString(),
          resolved: r.resolved,
          result: r.result,
          report: r.report,
        }))}
      />
    </main>
  );
}
