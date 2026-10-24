"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { ExpeditionKindDefinition } from "@/game/data/expeditionKinds";

interface LocationSummary {
  key: string;
  zoneKey: string;
  name: string;
  description: string;
  minLevel: number;
  maxLevel: number;
  timeMinutes: number;
  stamina: number;
  bossName: string | null;
  bossLevel: number | null;
}

interface ActiveExpedition {
  locationKey: string;
  kind: string;
  endAt: string;
}

interface SelectableAbility {
  key: string;
  name: string;
  effectText: string;
}

const ZONE_NAMES: Record<string, string> = {
  "szepczacy-las": "Szepczący Las (poziomy 1–10)",
  "bagna-mglistej-wiezy": "Bagna Mglistej Wieży (poziomy 11–25)",
};

const KIND_ORDER: Array<"SCOUT" | "HUNT" | "DEEP"> = ["SCOUT", "HUNT", "DEEP"];

const TACTICS: Array<{ key: "AGGRESSIVE" | "BALANCED" | "DEFENSIVE" | "RETREAT_30"; label: string }> = [
  { key: "AGGRESSIVE", label: "Natarcie" },
  { key: "BALANCED", label: "Wyważona" },
  { key: "DEFENSIVE", label: "Obrona" },
  { key: "RETREAT_30", label: "Odwrót < 30% PŻ" },
];

const SPELL_ELEMENTS: Array<{ key: "fire" | "ice" | "lightning"; label: string }> = [
  { key: "fire", label: "Ogień" },
  { key: "ice", label: "Lód" },
  { key: "lightning", label: "Błyskawica" },
];

const MAX_SELECTED_ABILITIES = 3;

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ExpeditionsClient({
  character,
  selectableAbilities,
  activeExpedition,
  locations,
  kinds,
  lastReport,
}: {
  character: { level: number; stamina: number; injuredUntil: string | null; classKey: string };
  selectableAbilities: SelectableAbility[];
  activeExpedition: ActiveExpedition | null;
  locations: LocationSummary[];
  kinds: Record<string, ExpeditionKindDefinition>;
  lastReport: string[] | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [tactic, setTactic] = useState<(typeof TACTICS)[number]["key"]>("BALANCED");
  const [spellElement, setSpellElement] = useState<(typeof SPELL_ELEMENTS)[number]["key"]>("fire");
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);

  function toggleAbility(key: string) {
    setSelectedAbilities((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAX_SELECTED_ABILITIES) return prev;
      return [...prev, key];
    });
  }

  useEffect(() => {
    if (!activeExpedition) return;

    const intervalRef: { current: ReturnType<typeof setInterval> | null } = { current: null };
    const tick = () => {
      const left = new Date(activeExpedition.endAt).getTime() - Date.now();
      setRemainingMs(left);
      if (left <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        router.refresh();
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeExpedition, router]);

  const isInjured = character.injuredUntil ? new Date(character.injuredUntil) > new Date() : false;

  async function start(locationKey: string, kind: string) {
    setError(null);
    setPendingKey(`${locationKey}:${kind}`);
    const response = await fetch("/api/expeditions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locationKey,
        kind,
        tactic,
        abilities: selectedAbilities,
        spellElement: character.classKey === "MAGE" ? spellElement : undefined,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setPendingKey(null);

    if (!response.ok) {
      setError(data.error ?? "Nie udało się wyruszyć na wyprawę.");
      return;
    }

    router.refresh();
  }

  const zones = Array.from(new Set(locations.map((l) => l.zoneKey)));

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div className="rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Wyprawy</h1>
        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-muted">Poziom</p>
            <p className="font-ui text-lg tabular-nums">{character.level}</p>
          </div>
          <div>
            <p className="text-muted">Wytrwałość</p>
            <p className="font-ui text-lg tabular-nums text-info">{character.stamina} / 100</p>
          </div>
        </div>
        {isInjured && (
          <p className="mt-3 text-sm text-danger">
            Jesteś ranny do {new Date(character.injuredUntil!).toLocaleTimeString("pl-PL")}. Nie możesz ruszyć na
            wyprawę.
          </p>
        )}
      </div>

      {lastReport && (
        <div className="rounded-lg border border-line bg-card p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
            Ostatni raport
          </h2>
          <div className="font-body mt-3 flex flex-col gap-2 text-foreground">
            {lastReport.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {activeExpedition ? (
        <div className="rounded-lg border border-line bg-card p-6 text-center">
          <p className="text-muted">Bohater jest na wyprawie. Wraca za:</p>
          <p className="font-ui mt-2 text-3xl tabular-nums text-accent">{formatCountdown(remainingMs)}</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-4 rounded border border-line px-4 py-2 text-sm text-foreground"
          >
            Odśwież
          </button>
        </div>
      ) : (
        <>
          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="rounded-lg border border-line bg-card p-5">
            <h2 className="font-display text-base font-bold text-foreground">Przed wyprawą</h2>

            <p className="mt-3 text-sm text-muted">Taktyka</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TACTICS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTactic(t.key)}
                  className={`rounded border px-3 py-2 text-sm ${
                    tactic === t.key ? "border-accent text-accent" : "border-line text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {character.classKey === "MAGE" && (
              <>
                <p className="mt-4 text-sm text-muted">Żywioł zaklęć</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SPELL_ELEMENTS.map((el) => (
                    <button
                      key={el.key}
                      type="button"
                      onClick={() => setSpellElement(el.key)}
                      className={`rounded border px-3 py-2 text-sm ${
                        spellElement === el.key ? "border-accent text-accent" : "border-line text-foreground"
                      }`}
                    >
                      {el.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {selectableAbilities.length > 0 && (
              <>
                <p className="mt-4 text-sm text-muted">
                  Zdolności (do {MAX_SELECTED_ABILITIES}) — {selectedAbilities.length}/{MAX_SELECTED_ABILITIES}
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  {selectableAbilities.map((ability) => {
                    const checked = selectedAbilities.includes(ability.key);
                    const disabled = !checked && selectedAbilities.length >= MAX_SELECTED_ABILITIES;
                    return (
                      <label
                        key={ability.key}
                        className={`flex items-start gap-2 text-sm ${disabled ? "opacity-40" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleAbility(ability.key)}
                          className="mt-1"
                        />
                        <span>
                          <span className="text-foreground">{ability.name}</span>{" "}
                          <span className="text-muted">— {ability.effectText}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {zones.map((zoneKey) => (
            <div key={zoneKey} className="flex flex-col gap-4">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
                {ZONE_NAMES[zoneKey] ?? zoneKey}
              </h2>

              {locations
                .filter((l) => l.zoneKey === zoneKey)
                .map((location) => {
                  const locked = character.level < location.minLevel;
                  return (
                    <div key={location.key} className="rounded-lg border border-line bg-card p-5">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-display text-base font-bold text-foreground">{location.name}</h3>
                        <span className="text-xs text-muted">poz. {location.minLevel}–{location.maxLevel}</span>
                      </div>
                      <p className="font-body mt-1 text-sm text-muted">{location.description}</p>

                      {locked ? (
                        <p className="mt-3 text-sm text-danger">Wymaga poziomu {location.minLevel}.</p>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {KIND_ORDER.map((kind) => {
                            const def = kinds[kind];
                            const time = Math.round(location.timeMinutes * def.timeMultiplier);
                            const stamina = Math.round(location.stamina * def.timeMultiplier);
                            const disabled =
                              isInjured || character.stamina < stamina || pendingKey === `${location.key}:${kind}`;
                            return (
                              <button
                                key={kind}
                                type="button"
                                disabled={disabled}
                                onClick={() => start(location.key, kind)}
                                className="rounded border border-line px-3 py-2 text-sm text-foreground disabled:opacity-40"
                              >
                                {def.name}
                                <span className="ml-1 text-muted">
                                  ({time} min, {stamina} wyt.)
                                </span>
                              </button>
                            );
                          })}

                          {location.bossName && (
                            <button
                              type="button"
                              disabled={
                                isInjured ||
                                character.level < (location.bossLevel ?? 0) ||
                                character.stamina < location.stamina ||
                                pendingKey === `${location.key}:BOSS`
                              }
                              onClick={() => start(location.key, "BOSS")}
                              className="rounded border border-accent px-3 py-2 text-sm text-accent disabled:opacity-40"
                            >
                              Boss: {location.bossName}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
