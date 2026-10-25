import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LOCATIONS } from "@/game/data/locations";
import { QUESTS } from "@/game/data/quests";
import { dailyQuestSlotsFor } from "@/lib/dailyQuests";
import { getCharacterForUser } from "@/lib/expeditions";
import { huntSlotsForLocation } from "@/lib/hunts";
import { prisma } from "@/lib/prisma";

export const instant = false;

const CONDITION_LABEL: Record<string, (target?: number) => string> = {
  WIN_COUNT: (target) => `${target} wygranych`,
  DEEP_WIN: () => "1 Głęboka wyprawa",
  BOSS_DEFEAT: () => "pokonaj bossa",
  FIND_ITEM: () => "znajdź w łupach",
};

const STATE_LABEL: Record<string, string> = {
  COMPLETED: "Ukończone",
  UNLOCKED_NO_REWARD: "Ukończone (bez nagrody za bossa)",
  ACTIVE: "W trakcie",
};

export default async function QuestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const character = await getCharacterForUser(session.user.id);
  if (!character) redirect("/character/new");

  const progress = await prisma.questProgress.findMany({ where: { characterId: character.id } });
  const progressByKey = new Map(progress.map((p) => [p.questKey, p]));
  const now = new Date();
  const dailySlots = dailyQuestSlotsFor(character.id, now);

  return (
    <main className="flex flex-1 justify-center p-4">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="rounded-lg border border-line bg-card p-6">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Zadania</h1>
          <p className="mt-1 text-sm text-muted">
            Rozdziały I–II: zadania fabularne (odblokowują kolejną lokację) i zlecenia.
          </p>
        </div>

        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground">Zadania dzienne (reset 6:00)</h2>
          <div className="mt-3 flex flex-col gap-3">
            {dailySlots
              .filter((slot) => progressByKey.get(slot.key)?.state !== "COMPLETED")
              .map((slot) => {
                const state = progressByKey.get(slot.key);
                const counter = Math.min(state?.counter ?? 0, slot.target);
                return (
                  <div key={slot.key} className="text-sm">
                    <p className="text-foreground">⭐ {slot.label}</p>
                    <p className="text-xs text-muted">({counter}/{slot.target})</p>
                  </div>
                );
              })}
          </div>
          {(() => {
            const done = dailySlots.filter((slot) => progressByKey.get(slot.key)?.state === "COMPLETED");
            if (done.length === 0) return null;
            return (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted">Ukończone dziś ({done.length})</summary>
                <div className="mt-2 flex flex-col gap-1">
                  {done.map((slot) => (
                    <p key={slot.key} className="text-sm text-success">
                      ⭐ {slot.label} — Ukończone
                    </p>
                  ))}
                </div>
              </details>
            );
          })()}
        </div>

        {LOCATIONS.map((location) => {
          const quests = QUESTS.filter((q) => q.locationKey === location.key);
          const hunts = huntSlotsForLocation(location.key, now);
          if (quests.length === 0) return null;

          const questIsDone = (quest: (typeof quests)[number]) => {
            const state = progressByKey.get(quest.key);
            return state ? state.state !== "ACTIVE" : false;
          };
          const huntIsDone = (hunt: (typeof hunts)[number]) => progressByKey.get(hunt.key)?.state === "COMPLETED";

          const activeQuests = quests.filter((q) => !questIsDone(q));
          const doneQuests = quests.filter((q) => questIsDone(q));
          const activeHunts = hunts.filter((h) => !huntIsDone(h));
          const doneHunts = hunts.filter((h) => huntIsDone(h));

          const renderQuest = (quest: (typeof quests)[number]) => {
            const state = progressByKey.get(quest.key);
            const isDone = questIsDone(quest);
            const counter = state?.counter ?? 0;
            return (
              <div key={quest.key} className="text-sm">
                <p className={isDone ? "text-success" : "text-foreground"}>
                  {quest.kind === "STORY" ? "📖 " : "📜 "}
                  {quest.title}
                  {isDone && ` — ${STATE_LABEL[state!.state]}`}
                </p>
                <p className="text-xs text-muted">{quest.summary}</p>
                <p className="text-xs text-muted">
                  Cel: {CONDITION_LABEL[quest.condition.type](quest.condition.target)}
                  {quest.condition.type === "WIN_COUNT" && !isDone && ` (${counter}/${quest.condition.target})`}
                </p>
              </div>
            );
          };

          const renderHunt = (hunt: (typeof hunts)[number], i: number) => {
            const state = progressByKey.get(hunt.key);
            const isDone = huntIsDone(hunt);
            const counter = state?.counter ?? 0;
            return (
              <div key={hunt.key} className="text-sm">
                <p className={isDone ? "text-success" : "text-foreground"}>
                  🏹 Łowy {i + 1}/3{isDone && " — Ukończone"}
                </p>
                <p className="text-xs text-muted">
                  Cel: {hunt.target} wygranych w tej lokacji{!isDone && ` (${Math.min(counter, hunt.target)}/${hunt.target})`}
                </p>
              </div>
            );
          };

          return (
            <div key={location.key} className="rounded-lg border border-line bg-card p-5">
              <h2 className="font-display text-base font-bold text-foreground">{location.name}</h2>

              <div className="mt-3 flex flex-col gap-3">
                {activeQuests.map(renderQuest)}
                {activeHunts.map((h) => renderHunt(h, hunts.indexOf(h)))}
              </div>

              {(doneQuests.length > 0 || doneHunts.length > 0) && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-muted">
                    Ukończone ({doneQuests.length + doneHunts.length})
                  </summary>
                  <div className="mt-2 flex flex-col gap-3">
                    {doneQuests.map(renderQuest)}
                    {doneHunts.map((h) => renderHunt(h, hunts.indexOf(h)))}
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
