import { describe, expect, it } from "vitest";

import { validateGuildName, validateGuildTag } from "../guildName";

describe("validateGuildName", () => {
  it("akceptuje poprawną nazwę z cyframi i polskimi znakami", () => {
    expect(validateGuildName("Żelazna Legia 7").ok).toBe(true);
  });

  it("odrzuca za krótką lub za długą nazwę", () => {
    expect(validateGuildName("ab").ok).toBe(false);
    expect(validateGuildName("a".repeat(25)).ok).toBe(false);
  });

  it("odrzuca znaki specjalne i emoji", () => {
    expect(validateGuildName("Legia@@").ok).toBe(false);
  });

  it("odrzuca zastrzeżone nazwy", () => {
    expect(validateGuildName("Admin").ok).toBe(false);
  });
});

describe("validateGuildTag", () => {
  it("akceptuje 2-4 wielkie litery", () => {
    expect(validateGuildTag("WSK").ok).toBe(true);
  });

  it("odrzuca cyfry i małe litery", () => {
    expect(validateGuildTag("W1").ok).toBe(false);
    expect(validateGuildTag("wsk").ok).toBe(false);
  });

  it("odrzuca zbyt długi skrót", () => {
    expect(validateGuildTag("WSKAL").ok).toBe(false);
  });
});
