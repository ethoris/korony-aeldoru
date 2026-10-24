import { describe, expect, it } from "vitest";

import { validateRegistrationInput } from "../validation/registration";

describe("validateRegistrationInput", () => {
  const valid = {
    email: "Gracz@Example.com",
    password: "haslo1234",
    ageConfirmed: true,
    termsAccepted: true,
  };

  it("przyjmuje poprawne dane i normalizuje e-mail do małych liter", () => {
    const result = validateRegistrationInput(valid);
    expect(result).toEqual({ ok: true, email: "gracz@example.com" });
  });

  it("odrzuca nieprawidłowy e-mail", () => {
    const result = validateRegistrationInput({ ...valid, email: "nie-email" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.email).toBeDefined();
  });

  it("odrzuca za krótkie hasło", () => {
    const result = validateRegistrationInput({ ...valid, password: "krotkie" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.password).toBeDefined();
  });

  it("wymaga zaznaczenia potwierdzenia 16+ (docs/gdd/12-spolecznosc.md)", () => {
    const result = validateRegistrationInput({ ...valid, ageConfirmed: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.ageConfirmed).toBeDefined();
  });

  it("wymaga zaznaczenia regulaminu i polityki prywatności", () => {
    const result = validateRegistrationInput({ ...valid, termsAccepted: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.termsAccepted).toBeDefined();
  });

  it("zgłasza wszystkie błędy naraz", () => {
    const result = validateRegistrationInput({
      email: "x",
      password: "a",
      ageConfirmed: false,
      termsAccepted: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual([
        "ageConfirmed",
        "email",
        "password",
        "termsAccepted",
      ]);
    }
  });
});
