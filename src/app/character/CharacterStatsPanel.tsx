"use client";

import Link from "next/link";
import { useState } from "react";

import { computeDerivedStats } from "@/game/character/derivedStats";
import { experienceToNextLevel } from "@/game/character/experience";
import { resetKindFor } from "@/game/character/statReset";
import { CLASSES } from "@/game/data/classes";
import { DEITIES } from "@/game/data/deities";
import { baseStatsForRace, RACES } from "@/game/data/races";
import type { ClassKey } from "@/game/combat/types";
import type { DeityKey } from "@/game/data/deities";
import type { RaceKey } from "@/game/data/races";

interface CharacterData {
  name: string;
  race: RaceKey;
  class: ClassKey;
  deity: DeityKey;
  level: number;
  experience: number;
  strength: number;
  dexterity: number;
  vitality: number;
  intellect: number;
  freePoints: number;
  goldPouch: number;
  fame: number;
  usedFreeResetAfter20: boolean;
}

type StatKey = "strength" | "dexterity" | "vitality" | "intellect";

const STAT_LABELS: Record<StatKey, string> = {
  strength: "Siła",
  dexterity: "Zręczność",
  vitality: "Wytrzymałość",
  intellect: "Intelekt",
};

const RESET_KIND_LABEL: Record<string, string> = {
  FREE_UNDER_21: "Darmowy (poziom 1–20)",
  FREE_FIRST_AFTER_20: "Darmowy (pierwszy reset od poziomu 21)",
  PAID: "Płatny",
};

export function CharacterStatsPanel({ character }: { character: CharacterData }) {
  const [stats, setStats] = useState({
    strength: character.strength,
    dexterity: character.dexterity,
    vitality: character.vitality,
    intellect: character.intellect,
  });
  const [freePoints, setFreePoints] = useState(character.freePoints);
  const [goldPouch, setGoldPouch] = useState(character.goldPouch);
  const [usedFreeResetAfter20, setUsedFreeResetAfter20] = useState(character.usedFreeResetAfter20);
  const [draft, setDraft] = useState<Record<StatKey, number>>({
    strength: 0,
    dexterity: 0,
    vitality: 0,
    intellect: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showResetPreview, setShowResetPreview] = useState(false);

  const draftTotal = draft.strength + draft.dexterity + draft.vitality + draft.intellect;
  const remaining = freePoints - draftTotal;

  const currentTotals: Record<StatKey, number> = {
    strength: stats.strength + draft.strength,
    dexterity: stats.dexterity + draft.dexterity,
    vitality: stats.vitality + draft.vitality,
    intellect: stats.intellect + draft.intellect,
  };

  const derived = computeDerivedStats(currentTotals, character.level);
  const nextLevelXp = experienceToNextLevel(character.level);

  const resetKind = resetKindFor(character.level, usedFreeResetAfter20);
  const resetBaseStats = baseStatsForRace(character.race);
  const resetDerived = computeDerivedStats(resetBaseStats, character.level);

  function adjust(stat: StatKey, delta: number) {
    setDraft((prev) => {
      const next = prev[stat] + delta;
      if (next < 0) return prev;
      if (delta > 0 && remaining <= 0) return prev;
      return { ...prev, [stat]: next };
    });
  }

  function cofnij() {
    setDraft({ strength: 0, dexterity: 0, vitality: 0, intellect: 0 });
    setError(null);
  }

  async function zatwierdz() {
    setPending(true);
    setError(null);
    const response = await fetch("/api/character/stats/allocate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Nie udało się rozdać punktów.");
      return;
    }

    setStats({
      strength: data.strength,
      dexterity: data.dexterity,
      vitality: data.vitality,
      intellect: data.intellect,
    });
    setFreePoints(data.freePoints);
    setDraft({ strength: 0, dexterity: 0, vitality: 0, intellect: 0 });
  }

  async function resetujStatystyki() {
    setPending(true);
    setError(null);
    setResultMessage(null);

    const response = await fetch("/api/character/stats/reset", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Nie udało się zresetować statystyk.");
      return;
    }

    setStats({
      strength: data.strength,
      dexterity: data.dexterity,
      vitality: data.vitality,
      intellect: data.intellect,
    });
    setFreePoints(data.freePoints);
    setGoldPouch(data.goldPouch);
    setDraft({ strength: 0, dexterity: 0, vitality: 0, intellect: 0 });
    setUsedFreeResetAfter20(true);
    setShowResetPreview(false);
    setResultMessage(
      data.cost > 0
        ? `Reset wykonany. Koszt: ${data.cost} złota.`
        : "Reset wykonany bezpłatnie.",
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">
          {character.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {RACES[character.race].name} · {CLASSES[character.class].name} · czciciel {DEITIES[character.deity].name}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Poziom" value={character.level} />
          <Stat label="PD" value={`${character.experience} / ${nextLevelXp}`} />
          <Stat label="Złoto" value={goldPouch} />
          <Stat label="Sława" value={character.fame} />
        </div>

        <div className="mt-4 flex gap-3">
          <Link href="/expeditions" className="rounded bg-accent px-4 py-2 text-sm font-semibold text-background">
            Wyprawy
          </Link>
          <Link href="/inventory" className="rounded border border-line px-4 py-2 text-sm text-foreground">
            Ekwipunek
          </Link>
          <Link href="/sklep" className="rounded border border-line px-4 py-2 text-sm text-foreground">
            Sklep
          </Link>
          <Link href="/twierdza" className="rounded border border-line px-4 py-2 text-sm text-foreground">
            Twierdza
          </Link>
          <Link href="/pvp" className="rounded border border-line px-4 py-2 text-sm text-foreground">
            PvP
          </Link>
          <Link href="/napady" className="rounded border border-line px-4 py-2 text-sm text-foreground">
            Napady
          </Link>
          <Link href="/gildia" className="rounded border border-line px-4 py-2 text-sm text-foreground">
            Gildia
          </Link>
          <Link href="/ranking" className="rounded border border-line px-4 py-2 text-sm text-foreground">
            Ranking
          </Link>
          <Link href="/quests" className="rounded border border-line px-4 py-2 text-sm text-foreground">
            Zadania
          </Link>
          <Link href="/konto" className="rounded border border-line px-4 py-2 text-sm text-foreground">
            Konto
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-card p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
          Statystyki
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Stat label="Punkty życia" value={Math.round(derived.maxHp)} />
          <Stat label="Obrona (bez ekwipunku)" value={Math.round(derived.defenseNoGear)} />
          <Stat label="Szansa na krytyk" value={`${derived.critChancePct.toFixed(1)}%`} />
          <Stat label="Wolne punkty" value={remaining} accent />
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {(Object.keys(STAT_LABELS) as StatKey[]).map((stat) => (
            <div key={stat} className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted">{STAT_LABELS[stat]}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjust(stat, -1)}
                  disabled={draft[stat] <= 0}
                  className="h-8 w-8 rounded border border-line text-foreground disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-10 text-center font-ui tabular-nums text-foreground">
                  {currentTotals[stat]}
                </span>
                <button
                  type="button"
                  onClick={() => adjust(stat, 1)}
                  disabled={remaining <= 0}
                  className="h-8 w-8 rounded border border-line text-foreground disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
        {resultMessage && <p className="mt-4 text-sm text-success">{resultMessage}</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={zatwierdz}
            disabled={pending || draftTotal === 0}
            className="rounded bg-accent px-4 py-2 font-semibold text-background disabled:opacity-60"
          >
            Zatwierdź
          </button>
          <button
            type="button"
            onClick={cofnij}
            disabled={draftTotal === 0}
            className="rounded border border-line px-4 py-2 text-foreground disabled:opacity-40"
          >
            Cofnij
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-card p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
          Reset statystyk
        </h2>
        <p className="mt-2 text-sm text-muted">
          Zwraca wszystkie rozdane punkty do nowego rozdania. Rasa, klasa, bóstwo i poziom zostają.
          Rodzaj resetu: <span className="text-foreground">{RESET_KIND_LABEL[resetKind]}</span>
          {resetKind === "PAID" && " — koszt zależy od poprzednich resetów w ostatnich 30 dniach."}
        </p>

        {!showResetPreview ? (
          <button
            type="button"
            onClick={() => setShowResetPreview(true)}
            className="mt-4 rounded border border-line px-4 py-2 text-sm text-foreground"
          >
            Pokaż podgląd resetu
          </button>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted">Teraz</p>
                <p>PŻ: {Math.round(derived.maxHp)}</p>
                <p>Obrona: {Math.round(derived.defenseNoGear)}</p>
                <p>Krytyk: {derived.critChancePct.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-muted">Po resecie</p>
                <p>PŻ: {Math.round(resetDerived.maxHp)}</p>
                <p>Obrona: {Math.round(resetDerived.defenseNoGear)}</p>
                <p>Krytyk: {resetDerived.critChancePct.toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetujStatystyki}
                disabled={pending}
                className="rounded bg-danger px-4 py-2 font-semibold text-background disabled:opacity-60"
              >
                Potwierdź reset
              </button>
              <button
                type="button"
                onClick={() => setShowResetPreview(false)}
                className="rounded border border-line px-4 py-2 text-foreground"
              >
                Zamknij
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded border border-line px-3 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-ui text-lg tabular-nums ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
