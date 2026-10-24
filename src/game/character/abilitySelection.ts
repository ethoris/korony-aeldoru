import { abilitiesForClass } from "@/game/data/abilities";
import type { ClassKey } from "@/game/combat/types";

export const MAX_SELECTED_ABILITIES = 3;

/** Zdolności odblokowane na danym poziomie, BEZ zdolności z poziomu 1 (ta jest zawsze aktywna, nie zajmuje wyboru). */
export function selectableAbilityKeys(classKey: ClassKey, level: number): string[] {
  return abilitiesForClass(classKey)
    .filter((a) => a.level > 1 && a.level <= level)
    .map((a) => a.key);
}

export type AbilitySelectionValidation = { ok: true; selected: string[] } | { ok: false; error: string };

/** Waliduje do 3 wybranych zdolności (docs/gdd/02-systemy-walki.md: "gracz wybiera 3 aktywne"). */
export function validateAbilitySelection(
  classKey: ClassKey,
  level: number,
  selected: string[],
): AbilitySelectionValidation {
  const unique = Array.from(new Set(selected));
  if (unique.length > MAX_SELECTED_ABILITIES) {
    return { ok: false, error: `Możesz wybrać maksymalnie ${MAX_SELECTED_ABILITIES} zdolności.` };
  }

  const allowed = new Set(selectableAbilityKeys(classKey, level));
  for (const key of unique) {
    if (!allowed.has(key)) {
      return { ok: false, error: `Zdolność "${key}" nie jest jeszcze odblokowana.` };
    }
  }

  return { ok: true, selected: unique };
}
