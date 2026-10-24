import { describe, expect, it } from "vitest";

import { MAX_SELECTED_ABILITIES, selectableAbilityKeys, validateAbilitySelection } from "../abilitySelection";

describe("selectableAbilityKeys", () => {
  it("nie zawiera zdolności z poziomu 1 (zawsze aktywna, nie zajmuje wyboru)", () => {
    const keys = selectableAbilityKeys("WARRIOR", 100);
    expect(keys).not.toContain("potezny-zamach");
  });

  it("zawiera tylko zdolności odblokowane na danym poziomie bohatera", () => {
    const keys = selectableAbilityKeys("WARRIOR", 24);
    expect(keys).toContain("okrzyk-bojowy"); // poz. 10
    expect(keys).not.toContain("rozplatanie"); // poz. 25
  });
});

describe("validateAbilitySelection", () => {
  it("przyjmuje do 3 odblokowanych zdolności", () => {
    const result = validateAbilitySelection("WARRIOR", 100, ["okrzyk-bojowy", "rozplatanie", "furia-tytana"]);
    expect(result.ok).toBe(true);
  });

  it("odrzuca ponad 3 zdolności", () => {
    const result = validateAbilitySelection("WARRIOR", 100, [
      "okrzyk-bojowy",
      "rozplatanie",
      "krwawa-rana",
      "furia-tytana",
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(String(MAX_SELECTED_ABILITIES));
  });

  it("odrzuca zdolność nieodblokowaną na obecnym poziomie", () => {
    const result = validateAbilitySelection("WARRIOR", 10, ["rozplatanie"]);
    expect(result.ok).toBe(false);
  });

  it("odrzuca zdolność z poziomu 1 jako wybór (jest automatyczna)", () => {
    const result = validateAbilitySelection("WARRIOR", 100, ["potezny-zamach"]);
    expect(result.ok).toBe(false);
  });

  it("odrzuca zdolność innej klasy", () => {
    const result = validateAbilitySelection("WARRIOR", 100, ["pocisk-mocy"]);
    expect(result.ok).toBe(false);
  });

  it("usuwa duplikaty bez traktowania ich jako przekroczenia limitu", () => {
    const result = validateAbilitySelection("WARRIOR", 100, ["okrzyk-bojowy", "okrzyk-bojowy"]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.selected).toEqual(["okrzyk-bojowy"]);
  });
});
