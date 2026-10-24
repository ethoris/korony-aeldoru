import { computeArmorTotal, computeShieldArmor, computeWeaponDamage } from "@/game/combat/equipment";
import type { ClassKey } from "@/game/combat/types";

import type { GeneratedItem, ItemSlot } from "./types";

const ARMOR_SLOT_SHARE: Record<string, number> = { ARMOR: 0.45, HELMET: 0.2, BOOTS: 0.2, GLOVES: 0.15 };

/**
 * GDD nie opisuje startowego ekwipunku wprost, ale bez niego Atak = 0 i
 * pierwsze walki byłyby nie do wygrania. Każdy nowy bohater dostaje zwykły
 * (COMMON) ekwipunek poziomu 1 na wszystkie podstawowe sloty – to założenie
 * dodane przez nas, nie z GDD.
 */
export function createStarterGear(classKey: ClassKey): GeneratedItem[] {
  const level = 1;
  const items: GeneratedItem[] = [
    {
      slot: "WEAPON",
      level,
      quality: "COMMON",
      name: "Podróżna broń",
      damageMin: Math.round(computeWeaponDamage(classKey, level, "COMMON") * 0.85),
      damageMax: Math.round(computeWeaponDamage(classKey, level, "COMMON") * 1.15),
      affixes: [],
      forClass: classKey,
    },
  ];

  for (const slot of ["ARMOR", "HELMET", "BOOTS", "GLOVES"] as ItemSlot[]) {
    items.push({
      slot,
      level,
      quality: "COMMON",
      name: "Podróżny ekwipunek",
      armor: Math.round(computeArmorTotal(classKey, level, "COMMON") * ARMOR_SLOT_SHARE[slot]),
      affixes: [],
      forClass: classKey,
    });
  }

  if (classKey === "PALADIN") {
    items.push({
      slot: "OFFHAND",
      level,
      quality: "COMMON",
      name: "Podróżna tarcza",
      armor: Math.round(computeShieldArmor(level, "COMMON")),
      affixes: [],
      forClass: classKey,
    });
  }

  return items;
}
