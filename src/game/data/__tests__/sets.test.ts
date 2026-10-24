import { describe, expect, it } from "vitest";

import { CLASSES } from "@/game/data/classes";

import { SETS, parseSetTemplateKey, setTemplateKey, setsForClass } from "../sets";

describe("sets", () => {
  it("12 zestawów: 2 na każdą z 6 klas", () => {
    expect(Object.keys(SETS)).toHaveLength(12);
    for (const classKey of Object.keys(CLASSES)) {
      expect(setsForClass(classKey as keyof typeof CLASSES)).toHaveLength(2);
    }
  });

  it("każdy zestaw ma 5 części na 5 różnych slotów", () => {
    for (const set of Object.values(SETS)) {
      expect(set.pieces).toHaveLength(5);
      expect(new Set(set.pieces.map((p) => p.slot)).size).toBe(5);
    }
  });

  it("setTemplateKey/parseSetTemplateKey są odwrotne", () => {
    const key = setTemplateKey("wojownik-i", "WEAPON");
    expect(parseSetTemplateKey(key)).toEqual({ setKey: "wojownik-i", slot: "WEAPON" });
  });

  it("nieznany lub puste templateKey nie parsuje się", () => {
    expect(parseSetTemplateKey(null)).toBeNull();
    expect(parseSetTemplateKey("cos-nieznanego:WEAPON")).toBeNull();
  });
});
