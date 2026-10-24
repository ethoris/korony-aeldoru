"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface UnitView {
  key: string;
  name: string;
  available: number;
}

interface OpponentView {
  id: string;
  name: string;
  level: number;
}

interface RaidView {
  id: string;
  isAttacker: boolean;
  opponentName: string;
  arrivalAt: string;
  resolved: boolean;
  result: string | null;
  report: string[];
}

export function RaidsClient({
  characterLevel,
  unlockLevel,
  hasFortress,
  units,
  opponents,
  raids,
}: {
  characterLevel: number;
  unlockLevel: number;
  hasFortress: boolean;
  units: UnitView[];
  opponents: OpponentView[];
  raids: RaidView[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [targetId, setTargetId] = useState(opponents[0]?.id ?? "");
  const [army, setArmy] = useState<Record<string, number>>({});

  async function send() {
    setError(null);
    setPending(true);
    const response = await fetch("/api/raids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defenderId: targetId, army }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się wysłać napadu.");
      return;
    }
    setArmy({});
    router.refresh();
  }

  if (characterLevel < unlockLevel) {
    return (
      <div className="w-full max-w-2xl rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Napady</h1>
        <p className="mt-2 text-sm text-muted">Napady odblokują się od poziomu {unlockLevel}. Masz poziom {characterLevel}.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Napady na twierdze</h1>
        {!hasFortress && <p className="mt-2 text-sm text-muted">Najpierw załóż twierdzę w zakładce Twierdza.</p>}
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>

      {hasFortress && (
        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground">Wyślij napad</h2>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="mt-2 w-full rounded border border-line bg-background px-2 py-1 text-sm text-foreground"
          >
            {opponents.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} (poz. {o.level})
              </option>
            ))}
          </select>
          <div className="mt-3 flex flex-col gap-2">
            {units.map((u) => (
              <div key={u.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">
                  {u.name} <span className="text-xs text-muted">(masz: {u.available})</span>
                </span>
                <input
                  type="number"
                  min={0}
                  max={u.available}
                  value={army[u.key] ?? 0}
                  onChange={(e) => setArmy((a) => ({ ...a, [u.key]: Math.max(0, Number(e.target.value) || 0) }))}
                  className="w-20 rounded border border-line bg-background px-2 py-1 text-sm text-foreground"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={pending || !targetId}
            onClick={send}
            className="mt-3 rounded bg-accent px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
          >
            Wyślij napad
          </button>
        </div>
      )}

      <div className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">Historia napadów</h2>
        {raids.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Brak napadów.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {raids.map((r) => (
              <div key={r.id} className="rounded border border-line p-3 text-sm">
                <p className="text-foreground">
                  {r.isAttacker ? "Atak na" : "Napad od"} {r.opponentName}
                </p>
                {r.resolved ? (
                  <>
                    <p className="text-xs text-muted">Wynik: {r.result === "ATTACKER_WIN" ? "wygrana atakującego" : "obrona skuteczna"}</p>
                    {r.report.map((line, i) => (
                      <p key={i} className="text-xs text-muted">
                        {line}
                      </p>
                    ))}
                  </>
                ) : (
                  <p className="text-xs text-muted">W drodze, dotarcie: {new Date(r.arrivalAt).toLocaleString("pl-PL")}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
