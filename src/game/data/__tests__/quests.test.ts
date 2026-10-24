import { describe, expect, it } from "vitest";

import { LOCATIONS } from "../locations";
import { QUESTS, questsForLocation, storyQuestUnlocking } from "../quests";

describe("quests", () => {
  it("każda z 11 lokacji rozdziałów I-II ma dokładnie 1 zadanie fabularne i 1 zlecenie", () => {
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

  it("finały rozdziałów są oznaczone i mają bossa z bestiariusza/lokacji", () => {
    const finales = QUESTS.filter((q) => q.isChapterFinale);
    expect(finales).toHaveLength(2);
    expect(finales[0].condition.bossKey).toBe("szczerbaty-krul");
  });
});
