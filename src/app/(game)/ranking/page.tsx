import { connection } from "next/server";

import { CLASSES } from "@/game/data/classes";
import { RACES } from "@/game/data/races";
import { prisma } from "@/lib/prisma";

// Zapytanie do bazy przy każdym wejściu – ranking ma być aktualny, nie
// zamrożony w statycznym shellu. connection() wymusza renderowanie na żywo.
export const instant = false;

export default async function RankingPage() {
  await connection();
  const characters = await prisma.character.findMany({
    orderBy: [{ level: "desc" }, { experience: "desc" }, { fame: "desc" }],
    take: 50,
    select: {
      id: true,
      name: true,
      race: true,
      class: true,
      level: true,
      fame: true,
      guildMembership: { select: { guild: { select: { tag: true } } } },
    },
  });

  return (
    <main className="flex flex-1 justify-center p-4">
      <div className="w-full max-w-2xl rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Ranking</h1>
        <p className="mt-1 text-sm text-muted">Najlepsi bohaterowie serwera Valmor.</p>

        {characters.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nikt jeszcze nie stworzył bohatera.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="py-2">#</th>
                <th className="py-2">Imię</th>
                <th className="py-2">Rasa / klasa</th>
                <th className="py-2 text-right">Poziom</th>
                <th className="py-2 text-right">Sława</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((character, index) => (
                <tr key={character.id} className="border-b border-line/50">
                  <td className="py-2 text-muted">{index + 1}</td>
                  <td className="py-2 text-foreground">
                    {character.guildMembership && (
                      <span className="text-muted">[{character.guildMembership.guild.tag}] </span>
                    )}
                    {character.name}
                  </td>
                  <td className="py-2 text-muted">
                    {RACES[character.race].name} · {CLASSES[character.class].name}
                  </td>
                  <td className="py-2 text-right font-ui tabular-nums text-foreground">{character.level}</td>
                  <td className="py-2 text-right font-ui tabular-nums text-accent">{character.fame}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
