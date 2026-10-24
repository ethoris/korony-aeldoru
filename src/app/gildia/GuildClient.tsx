"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface MemberView {
  characterId: string;
  name: string;
  level: number;
  role: "LEADER" | "MEMBER";
  joinedAt: string;
}

interface MyGuildView {
  id: string;
  name: string;
  tag: string;
  treasuryGold: number;
  leaderCharacterId: string;
  members: MemberView[];
}

interface GuildListEntry {
  id: string;
  name: string;
  tag: string;
  memberCount: number;
}

export function GuildClient({
  characterId,
  goldPouch,
  myGuild,
  guilds,
}: {
  characterId: string;
  goldPouch: number;
  myGuild: MyGuildView | null;
  guilds: GuildListEntry[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [treasuryAmount, setTreasuryAmount] = useState(100);
  const [renameInput, setRenameInput] = useState("");

  async function call(url: string, body?: unknown) {
    setError(null);
    setPending(true);
    const response = await fetch(url, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się wykonać akcji.");
      return false;
    }
    router.refresh();
    return true;
  }

  if (!myGuild) {
    return (
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="rounded-lg border border-line bg-card p-6">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Gildia</h1>
          <p className="mt-1 text-sm text-muted">Nie jesteś w żadnej gildii. Złoto: {goldPouch}</p>
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </div>

        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground">Załóż gildię (koszt: 5000 złota)</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nazwa (3-24 znaki)"
            className="mt-2 w-full rounded border border-line bg-background px-2 py-1 text-sm text-foreground"
          />
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value.toUpperCase())}
            placeholder="Skrót (2-4 wielkie litery)"
            className="mt-2 w-full rounded border border-line bg-background px-2 py-1 text-sm text-foreground"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => call("/api/guilds", { name, tag })}
            className="mt-3 rounded bg-accent px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
          >
            Załóż gildię
          </button>
        </div>

        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground">Dołącz do gildii</h2>
          {guilds.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Na tym serwerze nie ma jeszcze żadnej gildii.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {guilds.map((g) => (
                <div key={g.id} className="flex items-center justify-between gap-3 rounded border border-line p-3 text-sm">
                  <span className="text-foreground">
                    [{g.tag}] {g.name} <span className="text-xs text-muted">({g.memberCount}/20)</span>
                  </span>
                  <button
                    type="button"
                    disabled={pending || g.memberCount >= 20}
                    onClick={() => call("/api/guilds/join", { guildId: g.id })}
                    className="shrink-0 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
                  >
                    Dołącz
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const isLeader = myGuild.leaderCharacterId === characterId;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">
          [{myGuild.tag}] {myGuild.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Skarbiec: <span className="text-foreground">{myGuild.treasuryGold}</span> złota · Twoje złoto:{" "}
          <span className="text-foreground">{goldPouch}</span>
        </p>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={treasuryAmount}
            onChange={(e) => setTreasuryAmount(Math.max(1, Number(e.target.value) || 0))}
            className="w-24 rounded border border-line bg-background px-2 py-1 text-sm text-foreground"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => call("/api/guilds/treasury", { direction: "deposit", amount: treasuryAmount })}
            className="rounded border border-line px-3 py-1.5 text-xs text-foreground disabled:opacity-40"
          >
            Wpłać
          </button>
          {isLeader && (
            <button
              type="button"
              disabled={pending}
              onClick={() => call("/api/guilds/treasury", { direction: "withdraw", amount: treasuryAmount })}
              className="rounded border border-line px-3 py-1.5 text-xs text-foreground disabled:opacity-40"
            >
              Wypłać
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => call("/api/guilds/leave")}
            className="rounded border border-danger px-3 py-1.5 text-xs text-danger disabled:opacity-40"
          >
            Wyjdź z gildii
          </button>
        </div>
      </div>

      {isLeader && (
        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground">Zmień nazwę (co 30 dni, 5000 złota ze skarbca)</h2>
          <div className="mt-2 flex gap-2">
            <input
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              className="flex-1 rounded border border-line bg-background px-2 py-1 text-sm text-foreground"
            />
            <button
              type="button"
              disabled={pending || !renameInput}
              onClick={() => call("/api/guilds/rename", { name: renameInput })}
              className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
            >
              Zmień
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">Członkowie ({myGuild.members.length}/20)</h2>
        <div className="mt-3 flex flex-col gap-2">
          {myGuild.members.map((m) => (
            <div key={m.characterId} className="flex items-center justify-between gap-3 rounded border border-line p-3 text-sm">
              <span className="text-foreground">
                {m.name} <span className="text-xs text-muted">(poz. {m.level}, {m.role === "LEADER" ? "przywódca" : "członek"})</span>
              </span>
              {isLeader && m.characterId !== characterId && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => call("/api/guilds/kick", { targetCharacterId: m.characterId })}
                  className="rounded border border-danger px-2 py-1 text-xs text-danger disabled:opacity-40"
                >
                  Wyrzuć
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
