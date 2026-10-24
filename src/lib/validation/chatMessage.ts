import { containsProfanity } from "./profanity";

// docs/gdd/12-spolecznosc.md: limit 300 znaków, 1 wiadomość na 3 s, filtr
// wulgaryzmów i linków (linki tylko na kanale gildii).
export const CHAT_MAX_LENGTH = 300;
export const CHAT_RATE_LIMIT_MS = 3000;

const URL_PATTERN = /(https?:\/\/|www\.)[^\s]+/i;

export interface ChatMessageValidation {
  ok: boolean;
  error?: string;
}

export function containsLink(text: string): boolean {
  return URL_PATTERN.test(text);
}

export function validateChatMessage(content: string, allowLinks: boolean): ChatMessageValidation {
  const trimmed = content.trim();
  if (trimmed.length === 0) return { ok: false, error: "Wiadomość nie może być pusta." };
  if (trimmed.length > CHAT_MAX_LENGTH) {
    return { ok: false, error: `Wiadomość może mieć maks. ${CHAT_MAX_LENGTH} znaków.` };
  }
  if (!allowLinks && containsLink(trimmed)) {
    return { ok: false, error: "Linki są dozwolone tylko na kanale gildii." };
  }
  if (containsProfanity(trimmed)) {
    return { ok: false, error: "Wiadomość zawiera niedozwolone słowo." };
  }
  return { ok: true };
}
