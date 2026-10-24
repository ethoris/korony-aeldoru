import { describe, expect, it } from "vitest";

import { LOCATIONS } from "../locations";
import { QUESTS, questsForLocation, storyQuestUnlocking } from "../quests";

describe("quests", () => {
  it("każda z 42 lokacji rozdziałów I-VI ma dokładnie 1 zadanie fabularne i 1 zlecenie", () => {
    for (const location of LOCATIONS) {
      const quests = questsForLocation(location.key);
      expect(quests.filter((q) => q.kind === "STORY")).toHaveLength(1);
      expect(quests.filter((q) => q.kind === "COMMISSION")).toHaveLength(1);
    }
  });

  it("pierwsza lokacja każdego rozdziału nie wymaga wcześniejszego zadania", () => {
    expect(storyQuestUnlocking("piwnice-karczmy")).toBeNull();
  });

  it("kolejna lokacja wymaga zadania fabularnego poprzedniej", () => {
    const required = storyQuestUnlocking("polana-drwali");
    expect(required?.key).toBe("szczurza-robota");
  });

  it("pierwsza lokacja rozdziału II wymaga finału rozdziału I", () => {
    const required = storyQuestUnlocking("zatopiona-wioska");
    expect(required?.key).toBe("szczerbaty-krul-finale");
    expect(required?.isChapterFinale).toBe(true);
  });

  it("każdy z 6 rozdziałów ma dokładnie jeden finał", () => {
    const finales = QUESTS.filter((q) => q.isChapterFinale);
    expect(finales).toHaveLength(6);
    expect(new Set(finales.map((f) => f.chapter)).size).toBe(6);
  });

  it("finał rozdziału I jest oznaczony i ma bossa z bestiariusza/lokacji", () => {
    const finale = QUESTS.find((q) => q.isChapterFinale && q.chapter === 1);
    expect(finale?.condition.bossKey).toBe("szczerbaty-krul");
  });

  it("lokacja bossa rozdziału w zadaniu fabularnym typu BOSS_DEFEAT zgadza się z bossem lokacji", () => {
    for (const quest of QUESTS.filter((q) => q.condition.type === "BOSS_DEFEAT")) {
      const location = LOCATIONS.find((l) => l.key === quest.locationKey);
      expect(location?.bossKey).toBe(quest.condition.bossKey);
    }
  });

  it("kolejna kraina wymaga finału poprzedniej (np. Rozdział III po Rozdziale II)", () => {
    const required = storyQuestUnlocking("trollowy-most");
    expect(required?.key).toBe("ucieczka-nekromanty");
    expect(required?.isChapterFinale).toBe(true);
  });
});
