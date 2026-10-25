import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DEITIES } from "@/game/data/deities";
import { GRACE_PER_TIER, MAX_DEITY_TIER, tierForGrace } from "@/game/data/deityQuests";
import { getCharacterForUser } from "@/lib/expeditions";
import { listDeityQuestProgress } from "@/lib/deityQuests";
import { getFortressView } from "@/lib/fortress";

export const instant = false;

export default async function DeityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const character = await getCharacterForUser(session.user.id);
  if (!character) redirect("/character/new");

  const view = await getFortressView(character.id);
  const swiatyniaLevel = (view?.buildingLevels as Record<string, number> | undefined)?.SWIATYNIA ?? 0;
  const deity = DEITIES[character.deity];
  const tier = tierForGrace(character.deityGrace);
  const quests = swiatyniaLevel >= 1 ? await listDeityQuestProgress(character.id) : [];

  return (
    <main className="flex flex-1 justify-center p-4">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="rounded-lg border border-line bg-card p-6">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">
            {deity.name} <span className="text-sm text-muted">({deity.domain})</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Bazowy bonus: {deity.bonus}</p>
          <p className="mt-1 text-sm text-foreground">
            Łaska: {character.deityGrace} · Stopień {tier}/{MAX_DEITY_TIER} (co {GRACE_PER_TIER} łask) ·{" "}
            <span className="text-accent">+{tier * 20}% do bazowego bonusu</span>
          </p>
          {swiatyniaLevel < 1 && (
            <p className="mt-2 text-sm text-danger">Zadania bóstwa wymagają Świątyni poziomu 1 w twierdzy.</p>
          )}
        </div>

        {quests.length > 0 && (
          <div className="rounded-lg border border-line bg-card p-5">
            <h2 className="font-display text-base font-bold text-foreground">Zadania bóstwa</h2>
            <div className="mt-3 flex flex-col gap-2">
              {quests.map((q) => (
                <div key={q.level} className="flex items-center justify-between gap-3 rounded border border-line p-3 text-sm">
                  <div>
                    <p className={q.completed ? "text-success" : q.locked ? "text-muted" : "text-foreground"}>
                      poz. {q.level}: {q.title}
                    </p>
                    {!q.locked && !q.completed && (
                      <p className="text-xs text-muted">
                        {Math.min(q.progress, q.target)}/{q.target}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {q.completed ? "✓ ukończone" : q.locked ? "zablokowane" : "w toku"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
