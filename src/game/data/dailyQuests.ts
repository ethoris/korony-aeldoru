import { createRng } from "@/game/combat/rng";

/**
 * Zadania dzienne (docs/gdd/11-gospodarka-i-zadania.md): codziennie o 6:00
 * gracz dostaje 3 losowe zadania z puli.
 *
 * Uproszczenie: pula GDD wymienia też "5 walk PvP" i "ulepsz przedmiot" –
 * żadne z tych systemów jeszcze nie istnieje (PvP i kuźnia to wersje
 * 3–4), więc pula tutaj ma tylko typy, które da się już ukończyć.
 */
export type DailyQuestType = "EXPEDITIONS_COUNT" | "WINS_COUNT" | "BOSS_WIN" | "GOLD_EARNED" | "FIND_LOOT";

interface DailyQuestTypeDef {
  type: DailyQuestType;
  label: (target: number) => string;
  targetRange: [number, number];
}

const POOL: DailyQuestTypeDef[] = [
  { type: "EXPEDITIONS_COUNT", label: (t) => `Wyślij bohatera na ${t} wypraw`, targetRange: [5, 10] },
  { type: "WINS_COUNT", label: (t) => `Wygraj ${t} walk`, targetRange: [10, 20] },
  { type: "BOSS_WIN", label: () => "Pokonaj bossa", targetRange: [1, 1] },
  { type: "GOLD_EARNED", label: (t) => `Zdobądź ${t} złota z wypraw`, targetRange: [200, 600] },
  { type: "FIND_LOOT", label: () => "Znajdź jakikolwiek przedmiot w łupach", targetRange: [1, 1] },
];

export interface DailySlot {
  key: string;
  type: DailyQuestType;
  target: number;
  label: string;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/** 3 zadania dzienne dla tej postaci i dnia, deterministyczne (bez zapisu w bazie). */
export function generateDailyQuests(characterId: string, dayKey: string): DailySlot[] {
  const rng = createRng(hashString(`${characterId}:${dayKey}`));
  const pool = [...POOL];
  const chosen: DailyQuestTypeDef[] = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const index = Math.floor(rng() * pool.length);
    chosen.push(pool.splice(index, 1)[0]);
  }

  return chosen.map((def, i) => {
    const [min, max] = def.targetRange;
    const target = min + Math.floor(rng() * (max - min + 1));
    return { key: `dzienne:${dayKey}:${i}`, type: def.type, target, label: def.label(target) };
  });
}

export function dailyCompletionKey(dayKey: string): string {
  return `dzienne:${dayKey}:complete`;
}
