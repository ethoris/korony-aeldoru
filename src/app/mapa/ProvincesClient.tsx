"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface UnitView {
  key: string;
  name: string;
  available: number;
}

interface ProvinceView {
  key: string;
  name: string;
  region: number;
  regionName: string;
  zone: number;
  bonusText: string;
  garrison: number;
  ownerCharacterName: string | null;
  ownerGuildTag: string | null;
  protectionUntil: string | null;
  activeSiege: { id: string; attackerName: string; battleAt: string } | null;
}

interface RegionLordView {
  region: number;
  regionName: string;
  guildTag: string | null;
  guildName: string | null;
  provinceCount: number;
}

export function ProvincesClient({
  characterLevel,
  unlockLevel,
  units,
  provinces,
  lords,
}: {
  characterLevel: number;
  unlockLevel: number;
  units: UnitView[];
  provinces: ProvinceView[];
  lords: RegionLordView[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [target, setTarget] = useState<ProvinceView | null>(null);
  const [reinforceSiegeId, setReinforceSiegeId] = useState<string | null>(null);
  const [army, setArmy] = useState<Record<string, number>>({});

  async function siege() {
    if (!target) return;
    setError(null);
    setPending(true);
    const response = await fetch("/api/provinces/siege", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provinceKey: target.key, army }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się ogłosić oblężenia.");
      return;
    }
    setTarget(null);
    setArmy({});
    router.refresh();
  }

  async function reinforce(siegeId: string) {
    setError(null);
    setPending(true);
    const response = await fetch("/api/provinces/reinforce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siegeId, army }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się wysłać posiłków.");
      return;
    }
    setReinforceSiegeId(null);
    setArmy({});
    router.refresh();
  }

  if (characterLevel < unlockLevel) {
    return (
      <div className="w-full max-w-3xl rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Mapa prowincji</h1>
        <p className="mt-2 text-sm text-muted">Oblężenia odblokowują się od poziomu {unlockLevel}. Masz poziom {characterLevel}.</p>
      </div>
    );
  }

  const byRegion = [1, 2, 3, 4, 5].map((region) => ({
    region,
    lord: lords.find((l) => l.region === region),
    provinces: provinces.filter((p) => p.region === region),
  }));

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div className="rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Mapa prowincji</h1>
        <p className="mt-1 text-xs text-muted">Stolica Valmor jest neutralna. Oblężenie: ogłoszenie min. 12h przed bitwą, bitwa w oknie 18:00–22:00.</p>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>

      {(target || reinforceSiegeId) && (
        <div className="rounded-lg border border-accent bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground">
            {target ? `Ogłoś oblężenie: ${target.name}` : "Wyślij posiłki"}
          </h2>
          <div className="mt-2 flex flex-col gap-2">
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
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => (target ? siege() : reinforce(reinforceSiegeId!))}
              className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
            >
              Wyślij
            </button>
            <button
              type="button"
              onClick={() => {
                setTarget(null);
                setReinforceSiegeId(null);
              }}
              className="rounded border border-line px-3 py-1.5 text-xs text-foreground"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {byRegion.map(({ region, lord, provinces: regionProvinces }) => (
        <div key={region} className="rounded-lg border border-line bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground">
            {regionProvinces[0]?.regionName}{" "}
            {lord && lord.guildTag && <span className="text-xs text-accent">— Lord: [{lord.guildTag}] {lord.guildName}</span>}
          </h2>
          <div className="mt-2 flex flex-col gap-2">
            {regionProvinces.map((p) => (
              <div key={p.key} className="rounded border border-line p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground">
                    {p.name} <span className="text-xs text-muted">(strefa {p.zone}, garnizon {p.garrison})</span>
                  </span>
                  {!p.activeSiege && (!p.protectionUntil || new Date(p.protectionUntil) <= new Date()) && (
                    <button type="button" onClick={() => setTarget(p)} className="rounded border border-line px-2 py-1 text-xs text-foreground">
                      Oblegaj
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted">{p.bonusText}</p>
                <p className="text-xs text-muted">
                  {p.ownerCharacterName ? (
                    <>
                      Właściciel: {p.ownerCharacterName} {p.ownerGuildTag && `[${p.ownerGuildTag}]`}
                    </>
                  ) : (
                    "Niczyja (garnizon NPC)"
                  )}
                  {p.protectionUntil && new Date(p.protectionUntil) > new Date() && ` · ochrona do ${new Date(p.protectionUntil).toLocaleString("pl-PL")}`}
                </p>
                {p.activeSiege && (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-xs text-accent">
                      Oblężenie: {p.activeSiege.attackerName}, bitwa {new Date(p.activeSiege.battleAt).toLocaleString("pl-PL")}
                    </p>
                    {p.ownerCharacterName && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setReinforceSiegeId(p.activeSiege!.id)}
                        className="rounded border border-line px-2 py-1 text-xs text-foreground disabled:opacity-40"
                      >
                        Wyślij posiłki
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
