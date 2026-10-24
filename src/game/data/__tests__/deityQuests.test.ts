import { describe, expect, it } from "vitest";

import { DEITIES } from "@/game/data/deities";

import {
  DEITY_QUESTS,
  DEITY_QUEST_LEVELS,
  deityQuestsFor,
  tierForGrace,
  tierMultiplier,
} from "../deityQuests";

describe("deityQuests", () => {
  it("70 zadań: 10 na każde z 7 bóstw", () => {
    expect(DEITY_QUESTS).toHaveLength(70);
    for (const deity of Object.keys(DEITIES) as (keyof typeof DEITIES)[]) {
      expect(deityQuestsFor(deity)).toHaveLength(10);
    }
  });

  it("każde bóstwo ma zadania na poziomach 10..100 co 10", () => {
    for (const deity of Object.keys(DEITIES) as (keyof typeof DEITIES)[]) {
      const levels = deityQuestsFor(deity).map((d) => d.level);
      expect(levels).toEqual(DEITY_QUEST_LEVELS);
    }
  });

  it("klucze są unikalne", () => {
    expect(new Set(DEITY_QUESTS.map((d) => d.key)).size).toBe(70);
  });

  it("każde bóstwo ma oznaczone 1 przykładowe zadanie z GDD", () => {
    for (const deity of Object.keys(DEITIES) as (keyof typeof DEITIES)[]) {
      expect(deityQuestsFor(deity).filter((d) => d.example)).toHaveLength(1);
    }
  });

  it("stopień bonusu: 10 łask = 1 stopień, maks. 5, +20% za stopień", () => {
    expect(tierForGrace(0)).toBe(0);
    expect(tierForGrace(9)).toBe(0);
    expect(tierForGrace(10)).toBe(1);
    expect(tierForGrace(49)).toBe(4);
    expect(tierForGrace(50)).toBe(5);
    expect(tierForGrace(1000)).toBe(5);
    expect(tierMultiplier(0)).toBe(1);
    expect(tierMultiplier(50)).toBe(2);
  });
});
