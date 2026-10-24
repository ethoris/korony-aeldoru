import { createRng } from "@/game/combat/rng";

/**
 * Łowy (docs/gdd/06-zadania.md, "System"): 3 naraz na lokację, odnawiane co
 * dobę, generowane: pokonaj X potworów z lokacji. Nagroda: 3% PD poziomu,
 * 10×poziom złota, 1 mikstura (docs/gdd/11-gospodarka-i-zadania.md).
 *
 * Uproszczenie (ta sama zasada co w src/game/data/quests.ts): liczy się
 * wygrane w CAŁEJ lokacji, nie konkretny gatunek potwora.
 *
 * Cele są generowane deterministycznie z lokacji i dnia (bez zapisu w
 * bazie) – ten sam dzień i lokacja dają tę samą trójkę łowów dla każdego
 * gracza, odnawiają się automatycznie następnego dnia.
 */
const MIN_TARGET = 3;
const MAX_TARGET = 8;
const SLOTS = 3;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

export interface HuntSlot {
  key: string;
  target: number;
}

export function generateHunts(locationKey: string, dayKey: string): HuntSlot[] {
  const seed = hashString(`${locationKey}:${dayKey}`);
  const rng = createRng(seed);
  const slots: HuntSlot[] = [];
  for (let i = 0; i < SLOTS; i++) {
    const target = MIN_TARGET + Math.floor(rng() * (MAX_TARGET - MIN_TARGET + 1));
    slots.push({ key: `lowy:${locationKey}:${dayKey}:${i}`, target });
  }
  return slots;
}
