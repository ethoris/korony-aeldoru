import { foldPolish } from "@/lib/polishText";

import { containsProfanity } from "./profanity";

// docs/gdd/01-bohater-i-konto.md ("Imiona bohaterów i gildii"): nazwa 3-24
// znaki, litery (w tym polskie) + cyfry, jedna spacja/myślnik między wyrazami,
// apostrof; skrót 2-4 wielkie litery, bez cyfr.
const GUILD_NAME_PATTERN =
  /^[A-Za-z0-9ĄąĆćĘęŁłŃńÓóŚśŹźŻż]+(['-][A-Za-z0-9ĄąĆćĘęŁłŃńÓóŚśŹźŻż]+| [A-Za-z0-9ĄąĆćĘęŁłŃńÓóŚśŹźŻż]+)*$/;
const GUILD_TAG_PATTERN = /^[A-ZĄĆĘŁŃÓŚŹŻ]{2,4}$/;

const NAME_MIN = 3;
const NAME_MAX = 24;

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
].map(foldPolish);

export interface GuildNameValidation {
  ok: boolean;
  error?: string;
}

export function validateGuildName(rawName: string): GuildNameValidation {
  if (rawName.length < NAME_MIN || rawName.length > NAME_MAX) {
    return { ok: false, error: `Nazwa gildii musi mieć od ${NAME_MIN} do ${NAME_MAX} znaków.` };
  }
  if (!GUILD_NAME_PATTERN.test(rawName)) {
    return { ok: false, error: "Nazwa może zawierać tylko litery, cyfry, jedną spację/myślnik i apostrof." };
  }
  const key = foldPolish(rawName);
  if (RESERVED_NAMES.some((reserved) => key.includes(reserved))) {
    return { ok: false, error: "Ta nazwa jest zastrzeżona." };
  }
  if (containsProfanity(rawName)) {
    return { ok: false, error: "Ta nazwa zawiera niedozwolone słowo." };
  }
  return { ok: true };
}

export function validateGuildTag(rawTag: string): GuildNameValidation {
  if (!GUILD_TAG_PATTERN.test(rawTag)) {
    return { ok: false, error: "Skrót musi mieć 2–4 wielkie litery, bez cyfr." };
  }
  if (containsProfanity(rawTag)) {
    return { ok: false, error: "Ten skrót zawiera niedozwolone słowo." };
  }
  return { ok: true };
}

export function guildNameKey(rawName: string): string {
  return foldPolish(rawName);
}

export function guildTagKey(rawTag: string): string {
  return foldPolish(rawTag);
}
