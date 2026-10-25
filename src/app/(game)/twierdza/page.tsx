import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BUILDINGS, BUILDING_KEYS, FORTRESS_UNLOCK_LEVEL } from "@/game/data/buildings";
import { UNITS, UNIT_KEYS, armyLimit } from "@/game/data/units";
import { buildingCostFor, buildingTimeMinutesFor, getFortressView } from "@/lib/fortress";
import { getCharacterForUser } from "@/lib/expeditions";

import { FortressClient } from "./FortressClient";

export const instant = false;

export default async function FortressPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const character = await getCharacterForUser(session.user.id);
  if (!character) redirect("/character/new");

  const view = await getFortressView(character.id);
  const isDwarf = character.race === "DWARF";

  const buildings = BUILDING_KEYS.map((key) => {
    const def = BUILDINGS[key];
    const currentLevel = view?.buildingLevels[key] ?? 0;
    const targetLevel = currentLevel + 1;
    const atMax = currentLevel >= def.maxLevel;
    return {
      key,
      name: def.name,
      currentLevel,
      maxLevel: def.maxLevel,
      cost: atMax ? null : buildingCostFor(key, targetLevel, isDwarf),
      timeMinutes: atMax ? null : buildingTimeMinutesFor(key, targetLevel, isDwarf),
      producesResource: def.producesResource ?? null,
    };
  });

  const koszaryLevel = view?.buildingLevels.KOSZARY ?? 0;
  const units = UNIT_KEYS.map((key) => {
    const def = UNITS[key];
    const army = view?.armies.find((a) => a.unitKey === key);
    return {
      key,
      name: def.name,
      koszaryLevelRequired: def.koszaryLevelRequired,
      unlocked: koszaryLevel >= def.koszaryLevelRequired,
      cost: def.cost,
      trainingMinutesPerUnit: def.trainingMinutesPerUnit,
      quantity: army?.quantity ?? 0,
      trainingQuantity: army?.trainingQuantity ?? 0,
      trainingEndAt: army?.trainingEndAt?.toISOString() ?? null,
    };
  });

  return (
    <main className="flex flex-1 justify-center p-4">
      <FortressClient
        founded={view !== null}
        characterLevel={character.level}
        unlockLevel={FORTRESS_UNLOCK_LEVEL}
        goldPouch={character.goldPouch}
        resources={view?.resources ?? null}
        goldVault={view?.goldVault ?? 0}
        queue={
          view?.queue.map((q) => ({ building: q.building, targetLevel: q.targetLevel, endAt: q.endAt.toISOString() })) ?? []
        }
        buildings={buildings}
        units={units}
        armyLimit={armyLimit(koszaryLevel)}
      />
    </main>
  );
}
