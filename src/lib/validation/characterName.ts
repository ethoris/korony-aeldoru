import { foldPolish } from "@/lib/polishText";

import { containsProfanity } from "./profanity";

// docs/gdd/01-bohater-i-konto.md: litery (w tym polskie), jedna spacja lub
// myślnik między wyrazami, apostrof; bez cyfr, emoji, znaków specjalnych,
// dwóch spacji z rzędu, spacji na początku/końcu.
const NAME_PATTERN =
  /^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż]+(['-][A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż]+| [A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż]+)*$/;

const MIN_LENGTH = 3;
const MAX_LENGTH = 16;

// Słowa zastrzeżone (docs/gdd/01-bohater-i-konto.md): role administracyjne,
// nazwa gry/serwera, imiona bossów i postaci fabularnych. Lista startowa –
// sprawdzić i rozbudować przed premierą, tak jak nakazuje bestiariusz.
const RESERVED_NAMES = [
  "admin",
  "moderator",
  "administrator",
  "gm",
  "support",
  "aeldor",
  "aeldoru",
  "koronyaeldoru",
  "valmor",
  "szczerbaty",
  "krul",
  "morwena",
  "gorrag",
  "velnor",
  "cesarzowa",
  "ignar",
  "hezrath",
  "vaelstrax",
  "pierwotny",
  "valdris",
].map(foldPolish);

export interface CharacterNameValidation {
  ok: boolean;
  error?: string;
}

export function validateCharacterName(rawName: string): CharacterNameValidation {
  if (rawName.length < MIN_LENGTH || rawName.length > MAX_LENGTH) {
    return { ok: false, error: `Imię musi mieć od ${MIN_LENGTH} do ${MAX_LENGTH} znaków.` };
  }

  if (!NAME_PATTERN.test(rawName)) {
    return {
      ok: false,
      error:
        "Imię może zawierać tylko litery, jedną spację lub myślnik między wyrazami i apostrof.",
    };
  }

  const key = foldPolish(rawName);

  if (RESERVED_NAMES.some((reserved) => key.includes(reserved))) {
    return { ok: false, error: "To imię jest zastrzeżone." };
  }

  if (containsProfanity(rawName)) {
    return { ok: false, error: "To imię zawiera niedozwolone słowo." };
  }

  return { ok: true };
}

/** Znormalizowany klucz do porównań unikalności (bez polskich znaków, małe litery). */
export function characterNameKey(rawName: string): string {
  return foldPolish(rawName);
}
