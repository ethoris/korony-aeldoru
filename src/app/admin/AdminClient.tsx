"use client";

import { useEffect, useState } from "react";

interface SearchResult {
  characterId: string;
  userId: string;
  email: string;
  name: string;
  level: number;
  goldPouch: number;
  role: string;
}

interface Profile {
  characterId: string;
  email: string;
  name: string;
  level: number;
  experience: number;
  goldPouch: number;
  race: string;
  class: string;
  deity: string;
  fame: number;
  injuredUntil: string | null;
  createdAt: string;
  equippedItems: { id: string; name: string; slot: string; quality: string; level: number }[];
  recentBattleReports: { id: string; opponentKey: string; result: string; createdAt: string }[];
  recentGoldEvents: { id: string; amount: number; balanceAfter: number; reason: string; createdAt: string }[];
  recentItemEvents: { id: string; itemId: string; type: string; reason: string | null; createdAt: string }[];
  nameHistory: { oldName: string; newName: string; changedAt: string; forcedByMod: boolean }[];
  activeSanctions: { type: string; reason: string; expiresAt: string | null; createdAt: string }[];
}

interface AdminAction {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
}

interface MonitoringSnapshot {
  dbLatencyMs: number;
  dbOk: boolean;
  userCount: number;
  characterCount: number;
  activeCharactersLast24h: number;
  activeExpeditionsNow: number;
  recentErrors: { context: string; message: string; code: string | null; createdAt: string }[];
  errorCountLastHour: number;
}

const MONITORING_REFRESH_MS = 20_000;

export function AdminClient({
  isFullAdmin,
  maintenance,
  actions,
  monitoring: initialMonitoring,
}: {
  isFullAdmin: boolean;
  maintenance: { enabled: boolean; message: string | null };
  actions: AdminAction[];
  monitoring: MonitoringSnapshot;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [monitoring, setMonitoring] = useState(initialMonitoring);
  const [monitoringUpdatedAt, setMonitoringUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const response = await fetch("/api/admin/monitoring");
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as MonitoringSnapshot;
        if (!cancelled) {
          setMonitoring(data);
          setMonitoringUpdatedAt(new Date());
        }
      } catch {
        // Cichy błąd odświeżania – stare dane zostają widoczne, panel nie ma się czym wywrócić.
      }
    }
    const id = setInterval(refresh, MONITORING_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const [editReason, setEditReason] = useState("");
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [itemReason, setItemReason] = useState("");
  const [itemForm, setItemForm] = useState({ name: "", slot: "WEAPON", level: 1, quality: "RARE", forClass: "WARRIOR", damageMin: 0, damageMax: 0, armor: 0 });
  const [maintEnabled, setMaintEnabled] = useState(maintenance.enabled);
  const [maintMessage, setMaintMessage] = useState(maintenance.message ?? "");
  const [maintReason, setMaintReason] = useState("");

  async function search() {
    setError(null);
    const response = await fetch(`/api/admin/players?query=${encodeURIComponent(query)}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? "Błąd wyszukiwania.");
      return;
    }
    setResults(data.results);
  }

  async function openProfile(characterId: string) {
    setError(null);
    const response = await fetch(`/api/admin/players/${characterId}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? "Błąd wczytywania profilu.");
      return;
    }
    setProfile(data.profile);
    setEditFields({});
  }

  async function submitEdit() {
    if (!profile) return;
    setError(null);
    setPending(true);
    const body: Record<string, unknown> = { reason: editReason };
    for (const [key, value] of Object.entries(editFields)) {
      if (value.trim() !== "") body[key] = Number(value);
    }
    const response = await fetch(`/api/admin/players/${profile.characterId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się zapisać zmian.");
      return;
    }
    setEditReason("");
    setEditFields({});
    await openProfile(profile.characterId);
  }

  async function submitGrantItem() {
    if (!profile) return;
    setError(null);
    setPending(true);
    const response = await fetch(`/api/admin/players/${profile.characterId}/item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...itemForm, reason: itemReason }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się przyznać przedmiotu.");
      return;
    }
    setItemReason("");
    await openProfile(profile.characterId);
  }

  async function submitMaintenance() {
    setError(null);
    setPending(true);
    const response = await fetch("/api/admin/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: maintEnabled, message: maintMessage, reason: maintReason }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się zmienić trybu przerwy.");
      return;
    }
    setMaintReason("");
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div className="rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Panel {isFullAdmin ? "admina" : "moderatora"}</h1>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>

      <div className="rounded-lg border border-line bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-foreground">Monitoring</h2>
          <span className="text-[11px] text-muted">
            {monitoringUpdatedAt
              ? `odświeżone ${monitoringUpdatedAt.toLocaleTimeString("pl-PL")}`
              : `co ${MONITORING_REFRESH_MS / 1000}s`}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div className="rounded border border-line px-3 py-2">
            <p className="text-xs text-muted">Baza danych</p>
            <p className={monitoring.dbOk ? "text-success" : "text-danger"}>
              {monitoring.dbOk ? `OK · ${monitoring.dbLatencyMs}ms` : "NIEDOSTĘPNA"}
            </p>
          </div>
          <div className="rounded border border-line px-3 py-2">
            <p className="text-xs text-muted">Konta / postacie</p>
            <p className="text-foreground">
              {monitoring.userCount} / {monitoring.characterCount}
            </p>
          </div>
          <div className="rounded border border-line px-3 py-2">
            <p className="text-xs text-muted">Aktywni (24h)</p>
            <p className="text-foreground">{monitoring.activeCharactersLast24h}</p>
          </div>
          <div className="rounded border border-line px-3 py-2">
            <p className="text-xs text-muted">Wyprawy w toku</p>
            <p className="text-foreground">{monitoring.activeExpeditionsNow}</p>
          </div>
          <div className="rounded border border-line px-3 py-2">
            <p className="text-xs text-muted">Błędy (ostatnia godzina)</p>
            <p className={monitoring.errorCountLastHour > 0 ? "text-danger" : "text-success"}>
              {monitoring.errorCountLastHour}
            </p>
          </div>
        </div>

        {monitoring.recentErrors.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-foreground">Ostatnie błędy serwera:</p>
            <div className="mt-1 flex flex-col gap-1">
              {monitoring.recentErrors.map((e, i) => (
                <p key={i} className="text-xs text-muted">
                  {new Date(e.createdAt).toLocaleString("pl-PL")} — <span className="text-danger">{e.context}</span>
                  {e.code ? ` (${e.code})` : ""}: {e.message}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-line bg-card p-6">
        <h2 className="font-display text-base font-bold text-foreground">Szukaj gracza</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Imię, e-mail albo ID postaci"
            className="flex-1 rounded border border-line bg-background px-2 py-1 text-sm text-foreground"
          />
          <button type="button" onClick={search} className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background">
            Szukaj
          </button>
        </div>
        {results.length > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            {results.map((r) => (
              <button
                key={r.characterId}
                type="button"
                onClick={() => openProfile(r.characterId)}
                className="rounded border border-line px-2 py-1 text-left text-xs text-foreground hover:bg-background"
              >
                {r.name} ({r.email}) — poz. {r.level}, {r.goldPouch} złota, rola: {r.role}
              </button>
            ))}
          </div>
        )}
      </div>

      {profile && (
        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground">{profile.name}</h2>
          <p className="text-xs text-muted">
            {profile.email} · {profile.race} {profile.class} · {profile.deity} · konto od {new Date(profile.createdAt).toLocaleDateString("pl-PL")}
          </p>
          <p className="mt-1 text-sm text-foreground">
            Poziom {profile.level} · PD {profile.experience} · Złoto {profile.goldPouch} · Sława {profile.fame}
            {profile.injuredUntil && new Date(profile.injuredUntil) > new Date() && " · RANNY"}
          </p>

          {profile.activeSanctions.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-danger">Aktywne kary:</p>
              {profile.activeSanctions.map((s, i) => (
                <p key={i} className="text-xs text-muted">
                  {s.type}: {s.reason} {s.expiresAt ? `(do ${new Date(s.expiresAt).toLocaleString("pl-PL")})` : "(trwałe)"}
                </p>
              ))}
            </div>
          )}

          <div className="mt-3">
            <p className="text-xs font-semibold text-foreground">Ekwipunek:</p>
            {profile.equippedItems.map((i) => (
              <p key={i.id} className="text-xs text-muted">
                {i.slot}: {i.name} ({i.quality}, poz. {i.level})
              </p>
            ))}
          </div>

          <div className="mt-3">
            <p className="text-xs font-semibold text-foreground">Ostatnie ruchy złota:</p>
            {profile.recentGoldEvents.slice(0, 5).map((g) => (
              <p key={g.id} className="text-xs text-muted">
                {g.amount >= 0 ? "+" : ""}{g.amount} ({g.reason}) → {g.balanceAfter}
              </p>
            ))}
          </div>

          <div className="mt-3">
            <p className="text-xs font-semibold text-foreground">Ostatnie raporty walk:</p>
            {profile.recentBattleReports.slice(0, 5).map((b) => (
              <p key={b.id} className="text-xs text-muted">
                {b.opponentKey}: {b.result} ({new Date(b.createdAt).toLocaleString("pl-PL")})
              </p>
            ))}
          </div>

          {profile.nameHistory.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-foreground">Historia imion:</p>
              {profile.nameHistory.map((n, i) => (
                <p key={i} className="text-xs text-muted">
                  {n.oldName} → {n.newName} ({new Date(n.changedAt).toLocaleDateString("pl-PL")}{n.forcedByMod ? ", wymuszone" : ""})
                </p>
              ))}
            </div>
          )}

          {isFullAdmin && (
            <>
              <div className="mt-4 rounded border border-line p-3">
                <p className="text-xs font-semibold text-foreground">Edycja postaci (wymaga powodu)</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {["level", "experience", "goldPouch", "freePoints", "stamina"].map((field) => (
                    <input
                      key={field}
                      placeholder={field}
                      value={editFields[field] ?? ""}
                      onChange={(e) => setEditFields((f) => ({ ...f, [field]: e.target.value }))}
                      className="rounded border border-line bg-background px-2 py-1 text-xs text-foreground"
                    />
                  ))}
                </div>
                <input
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Powód (wymagany)"
                  className="mt-2 w-full rounded border border-line bg-background px-2 py-1 text-xs text-foreground"
                />
                <button
                  type="button"
                  disabled={pending || !editReason}
                  onClick={submitEdit}
                  className="mt-2 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
                >
                  Zapisz zmiany
                </button>
              </div>

              <div className="mt-4 rounded border border-line p-3">
                <p className="text-xs font-semibold text-foreground">Przyznaj / zwróć przedmiot</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input placeholder="Nazwa" value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} className="rounded border border-line bg-background px-2 py-1 text-xs text-foreground" />
                  <select value={itemForm.slot} onChange={(e) => setItemForm((f) => ({ ...f, slot: e.target.value }))} className="rounded border border-line bg-background px-2 py-1 text-xs text-foreground">
                    {["WEAPON", "OFFHAND", "HELMET", "ARMOR", "GLOVES", "BOOTS", "AMULET", "RING"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input type="number" placeholder="Poziom" value={itemForm.level} onChange={(e) => setItemForm((f) => ({ ...f, level: Number(e.target.value) }))} className="rounded border border-line bg-background px-2 py-1 text-xs text-foreground" />
                  <select value={itemForm.quality} onChange={(e) => setItemForm((f) => ({ ...f, quality: e.target.value }))} className="rounded border border-line bg-background px-2 py-1 text-xs text-foreground">
                    {["COMMON", "MAGIC", "RARE", "LEGENDARY"].map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                  <select value={itemForm.forClass} onChange={(e) => setItemForm((f) => ({ ...f, forClass: e.target.value }))} className="rounded border border-line bg-background px-2 py-1 text-xs text-foreground">
                    {["WARRIOR", "PALADIN", "ARCHER", "ROGUE", "MAGE", "PRIEST"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input type="number" placeholder="Obrażenia min" value={itemForm.damageMin} onChange={(e) => setItemForm((f) => ({ ...f, damageMin: Number(e.target.value) }))} className="rounded border border-line bg-background px-2 py-1 text-xs text-foreground" />
                  <input type="number" placeholder="Obrażenia max" value={itemForm.damageMax} onChange={(e) => setItemForm((f) => ({ ...f, damageMax: Number(e.target.value) }))} className="rounded border border-line bg-background px-2 py-1 text-xs text-foreground" />
                  <input type="number" placeholder="Pancerz" value={itemForm.armor} onChange={(e) => setItemForm((f) => ({ ...f, armor: Number(e.target.value) }))} className="rounded border border-line bg-background px-2 py-1 text-xs text-foreground" />
                </div>
                <input
                  value={itemReason}
                  onChange={(e) => setItemReason(e.target.value)}
                  placeholder="Powód (wymagany)"
                  className="mt-2 w-full rounded border border-line bg-background px-2 py-1 text-xs text-foreground"
                />
                <button
                  type="button"
                  disabled={pending || !itemReason || !itemForm.name}
                  onClick={submitGrantItem}
                  className="mt-2 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
                >
                  Przyznaj przedmiot
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {isFullAdmin && (
        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground">Tryb przerwy technicznej</h2>
          <p className="text-xs text-muted">
            Obecnie: {maintenance.enabled ? "WŁĄCZONY" : "wyłączony"}. Nie dolicza jeszcze automatycznie czasu przerwy do wypraw/budów w trakcie.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <label className="text-xs text-foreground">
              <input type="checkbox" checked={maintEnabled} onChange={(e) => setMaintEnabled(e.target.checked)} className="mr-1" />
              Włączony
            </label>
          </div>
          <input
            value={maintMessage}
            onChange={(e) => setMaintMessage(e.target.value)}
            placeholder="Komunikat dla graczy"
            className="mt-2 w-full rounded border border-line bg-background px-2 py-1 text-xs text-foreground"
          />
          <input
            value={maintReason}
            onChange={(e) => setMaintReason(e.target.value)}
            placeholder="Powód (wymagany)"
            className="mt-2 w-full rounded border border-line bg-background px-2 py-1 text-xs text-foreground"
          />
          <button
            type="button"
            disabled={pending || !maintReason}
            onClick={submitMaintenance}
            className="mt-2 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
          >
            Zapisz
          </button>
        </div>
      )}

      <div className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">Dziennik działań</h2>
        <div className="mt-2 flex flex-col gap-1">
          {actions.map((a) => (
            <p key={a.id} className="text-xs text-muted">
              {new Date(a.createdAt).toLocaleString("pl-PL")} — {a.adminEmail}: {a.action} ({a.targetType} {a.targetId}) — {a.reason}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
