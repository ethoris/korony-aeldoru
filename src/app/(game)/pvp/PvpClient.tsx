"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BattleReportView } from "@/components/BattleReportView";
import type { ReportLineView } from "@/components/BattleReportView";

interface OpponentView {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  fame: number;
  attacksLeftToday: number;
}

export function PvpClient({
  characterLevel,
  unlockLevel,
  fame,
  opponents,
}: {
  characterLevel: number;
  unlockLevel: number;
  fame: number;
  opponents: OpponentView[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportLineView[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [tactic, setTactic] = useState("BALANCED");

  async function attack(defenderId: string) {
    setError(null);
    setReport(null);
    setPendingId(defenderId);
    const response = await fetch("/api/pvp/attack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defenderId, tactic }),
    });
    const data = await response.json().catch(() => ({}));
    setPendingId(null);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się zaatakować.");
      return;
    }
    setReport(data.report);
    router.refresh();
  }

  if (characterLevel < unlockLevel) {
    return (
      <div className="w-full max-w-2xl rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Pojedynki PvP</h1>
        <p className="mt-2 text-sm text-muted">
          Pojedynki odblokowują się od poziomu {unlockLevel}. Masz poziom {characterLevel}.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Pojedynki PvP</h1>
        <p className="mt-1 text-sm text-muted">
          Sława: <span className="text-foreground">{fame}</span>
        </p>
        <div className="mt-2 flex items-center gap-2">
          <label htmlFor="pvp-tactic" className="text-xs text-muted">
            Taktyka:
          </label>
          <select
            id="pvp-tactic"
            value={tactic}
            onChange={(e) => setTactic(e.target.value)}
            className="rounded border border-line bg-background px-2 py-1 text-xs text-foreground"
          >
            <option value="AGGRESSIVE">Natarcie</option>
            <option value="BALANCED">Równowaga</option>
            <option value="DEFENSIVE">Defensywa</option>
          </select>
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>

      {report && (
        <div className="rounded-lg border border-line bg-card p-5 text-sm">
          <BattleReportView lines={report} />
        </div>
      )}

      <div className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">Przeciwnicy w zakresie ±5 poziomów</h2>
        {opponents.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nikt w zakresie poziomów nie jest jeszcze dostępny.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {opponents.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 rounded border border-line p-3 text-sm">
                <div>
                  <p className="text-foreground">
                    {o.name} <span className="text-xs text-muted">(poz. {o.level}, sława {o.fame})</span>
                  </p>
                  <p className="text-xs text-muted">Ataki dziś: {o.attacksLeftToday}/3</p>
                </div>
                <button
                  type="button"
                  disabled={pendingId === o.id || o.attacksLeftToday <= 0}
                  onClick={() => attack(o.id)}
                  className="shrink-0 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
                >
                  Atakuj
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
