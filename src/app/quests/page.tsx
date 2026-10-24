import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LOCATIONS } from "@/game/data/locations";
import { QUESTS } from "@/game/data/quests";
import { getCharacterForUser } from "@/lib/expeditions";
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

  return (
    <main className="flex flex-1 justify-center p-4">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="rounded-lg border border-line bg-card p-6">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Zadania</h1>
          <p className="mt-1 text-sm text-muted">
            Rozdziały I–II: zadania fabularne (odblokowują kolejną lokację) i zlecenia.
          </p>
        </div>

        {LOCATIONS.map((location) => {
          const quests = QUESTS.filter((q) => q.locationKey === location.key);
          if (quests.length === 0) return null;

          return (
            <div key={location.key} className="rounded-lg border border-line bg-card p-5">
              <h2 className="font-display text-base font-bold text-foreground">{location.name}</h2>

              <div className="mt-3 flex flex-col gap-3">
                {quests.map((quest) => {
                  const state = progressByKey.get(quest.key);
                  const isDone = state ? state.state !== "ACTIVE" : false;
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
                })}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
