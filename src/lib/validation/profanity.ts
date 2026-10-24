import { foldPolish } from "@/lib/polishText";

// Minimalna lista placeholder (docs/gdd/12-spolecznosc.md wymaga filtra
// wulgaryzmów, też zapisanych z podmianą liter). Rozbudować przed startem
// publicznym – to tylko pierwsza wersja, nie lista docelowa.
const BANNED_FRAGMENTS = ["kurw", "chuj", "pizd", "cipa", "huj", "dupcz"];

const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
};

function deleetify(text: string): string {
  return text
    .split("")
    .map((ch) => LEET_MAP[ch] ?? ch)
    .join("");
}

/** Sprawdza, czy tekst zawiera wulgaryzm (też zapisany z podmianą liter typu 0→o). */
export function containsProfanity(text: string): boolean {
  const normalized = foldPolish(deleetify(text));
  return BANNED_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}
