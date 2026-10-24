const DIACRITICS: Record<string, string> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
};

/** Usuwa polskie znaki diakrytyczne i sprowadza do małych liter. */
export function foldPolish(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => DIACRITICS[ch] ?? ch)
    .join("");
}
