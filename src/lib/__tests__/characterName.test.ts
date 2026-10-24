import { describe, expect, it } from "vitest";

import { characterNameKey, validateCharacterName } from "../validation/characterName";

describe("validateCharacterName", () => {
  it("przyjmuje typowe imiona z polskimi znakami", () => {
    expect(validateCharacterName("Łukasz").ok).toBe(true);
    expect(validateCharacterName("Anna-Maria").ok).toBe(true);
    expect(validateCharacterName("O'Brien").ok).toBe(true);
    expect(validateCharacterName("Jan Kowalski").ok).toBe(true);
  });

  it("odrzuca za krótkie i za długie imiona", () => {
    expect(validateCharacterName("Aa").ok).toBe(false);
    expect(validateCharacterName("A".repeat(17)).ok).toBe(false);
  });

  it("odrzuca cyfry i znaki specjalne", () => {
    expect(validateCharacterName("Gracz1").ok).toBe(false);
    expect(validateCharacterName("Gra@cz").ok).toBe(false);
  });

  it("odrzuca dwie spacje z rzędu oraz spację na początku/końcu", () => {
    expect(validateCharacterName("Jan  Kowalski").ok).toBe(false);
    expect(validateCharacterName(" Janek").ok).toBe(false);
    expect(validateCharacterName("Janek ").ok).toBe(false);
  });

  it("odrzuca zastrzeżone słowa niezależnie od wielkości liter i polskich znaków", () => {
    expect(validateCharacterName("Admin").ok).toBe(false);
    expect(validateCharacterName("ADMIN").ok).toBe(false);
    expect(validateCharacterName("Morwena").ok).toBe(false);
  });
});

describe("characterNameKey", () => {
  it("Łukasz, lukasz i ŁUKASZ dają ten sam klucz (docs/gdd/01-bohater-i-konto.md)", () => {
    const key = characterNameKey("Łukasz");
    expect(characterNameKey("lukasz")).toBe(key);
    expect(characterNameKey("ŁUKASZ")).toBe(key);
  });
});
