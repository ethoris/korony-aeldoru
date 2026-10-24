"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface ReportView {
  id: string;
  reporterName: string;
  targetName: string;
  reason: string;
  resolved: boolean;
  createdAt: string;
}

export function ModerationClient({ reports }: { reports: ReportView[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [characterId, setCharacterId] = useState("");
  const [sanctionType, setSanctionType] = useState<"MUTE" | "TRADE_BAN" | "ACCOUNT_BAN">("MUTE");
  const [duration, setDuration] = useState(24);
  const [reason, setReason] = useState("");

  async function applySanction() {
    setError(null);
    setPending(true);
    const response = await fetch("/api/admin/sanctions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId, type: sanctionType, reason, durationHours: sanctionType === "ACCOUNT_BAN" ? null : duration }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się nałożyć kary.");
      return;
    }
    router.refresh();
  }

  async function resolve(reportId: string) {
    const resolution = window.prompt("Rozstrzygnięcie:") ?? "";
    await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, resolution }),
    });
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Panel moderatora</h1>
        <p className="mt-1 text-xs text-muted">
          Minimalna wersja: ID postaci wpisuje się ręcznie (bez wyszukiwarki po imieniu) – pełny panel z 13-technika.md to osobny kawałek pracy.
        </p>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>

      <div className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">Nałóż karę</h2>
        <div className="mt-2 flex flex-col gap-2">
          <input
            value={characterId}
            onChange={(e) => setCharacterId(e.target.value)}
            placeholder="ID postaci"
            className="rounded border border-line bg-background px-2 py-1 text-sm text-foreground"
          />
          <select
            value={sanctionType}
            onChange={(e) => setSanctionType(e.target.value as typeof sanctionType)}
            className="rounded border border-line bg-background px-2 py-1 text-sm text-foreground"
          >
            <option value="MUTE">Wyciszenie</option>
            <option value="TRADE_BAN">Blokada handlu</option>
            <option value="ACCOUNT_BAN">Blokada konta</option>
          </select>
          {sanctionType !== "ACCOUNT_BAN" && (
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 0))}
              placeholder="Czas (godziny)"
              className="rounded border border-line bg-background px-2 py-1 text-sm text-foreground"
            />
          )}
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Powód (wymagany)"
            className="rounded border border-line bg-background px-2 py-1 text-sm text-foreground"
          />
          <button
            type="button"
            disabled={pending || !characterId || !reason}
            onClick={applySanction}
            className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
          >
            Nałóż karę
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">Zgłoszenia</h2>
        {reports.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Brak zgłoszeń.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {reports.map((r) => (
              <div key={r.id} className="rounded border border-line p-3 text-sm">
                <p className="text-foreground">
                  {r.reporterName} zgłasza {r.targetName}: {r.reason}
                </p>
                <p className="text-xs text-muted">{r.resolved ? "rozwiązane" : "nierozwiązane"}</p>
                {!r.resolved && (
                  <button type="button" onClick={() => resolve(r.id)} className="mt-1 rounded border border-line px-2 py-1 text-xs text-foreground">
                    Rozwiąż
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
