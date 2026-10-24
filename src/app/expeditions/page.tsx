import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { selectableAbilityKeys } from "@/game/character/abilitySelection";
import { abilitiesForClass } from "@/game/data/abilities";
import { EXPEDITION_KINDS } from "@/game/data/expeditionKinds";
import { LOCATIONS } from "@/game/data/locations";
import { getMonster } from "@/game/data/monsters";
import { POTIONS } from "@/game/data/potions";
import { getCharacterForUser, syncCharacter } from "@/lib/expeditions";
import { prisma } from "@/lib/prisma";

import { ExpeditionsClient } from "./ExpeditionsClient";

// Cała strona zależy od sesji i rozlicza wyprawy przy wejściu – nie da się
// jej prerenderować jako statyczny shell.
export const instant = false;

export default async function ExpeditionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const character = await getCharacterForUser(session.user.id);
  if (!character) redirect("/character/new");

  const { character: fresh, settlementReportLines } = await syncCharacter(character.id);

  const activeExpedition = await prisma.expedition.findFirst({
    where: { characterId: fresh.id, settled: false },
  });

  const locations = LOCATIONS.map((location) => ({
    key: location.key,
    zoneKey: location.zoneKey,
    name: location.name,
    description: location.description,
    minLevel: location.minLevel,
    maxLevel: location.maxLevel,
    timeMinutes: location.timeMinutes,
    stamina: location.stamina,
    bossName: location.bossKey ? getMonster(location.bossKey).name : null,
    bossLevel: location.bossKey ? getMonster(location.bossKey).level : null,
  }));

  const unlockedKeys = new Set(selectableAbilityKeys(fresh.class, fresh.level));
  const selectableAbilities = abilitiesForClass(fresh.class)
    .filter((a) => unlockedKeys.has(a.key))
    .map((a) => ({ key: a.key, name: a.name, effectText: a.effectText }));

  const consumables = await prisma.consumable.findMany({ where: { characterId: fresh.id } });
  const ownedByKind = new Map(consumables.map((c) => [c.kind, c.quantity]));
  const combatPotions = Object.values(POTIONS)
    .filter((p) => p.kind === "COMBAT" && (ownedByKind.get(p.key) ?? 0) > 0)
    .map((p) => ({ key: p.key, name: p.name, effectText: p.effectText, owned: ownedByKind.get(p.key) ?? 0 }));

  return (
    <main className="flex flex-1 justify-center p-4">
      <ExpeditionsClient
        character={{
          level: fresh.level,
          stamina: fresh.stamina,
          injuredUntil: fresh.injuredUntil?.toISOString() ?? null,
          classKey: fresh.class,
        }}
        selectableAbilities={selectableAbilities}
        ownedCombatPotions={combatPotions}
        activeExpedition={
          activeExpedition
            ? { locationKey: activeExpedition.locationKey, kind: activeExpedition.kind, endAt: activeExpedition.endAt.toISOString() }
            : null
        }
        locations={locations}
        kinds={EXPEDITION_KINDS}
        lastReport={settlementReportLines?.[settlementReportLines.length - 1] ?? null}
      />
    </main>
  );
}
