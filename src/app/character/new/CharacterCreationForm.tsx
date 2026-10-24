"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CLASSES } from "@/game/data/classes";
import { DEITIES } from "@/game/data/deities";
import { RACES } from "@/game/data/races";
import type { ClassKey, Stats } from "@/game/combat/types";
import type { DeityKey } from "@/game/data/deities";
import type { RaceKey } from "@/game/data/races";

const RACE_KEYS = Object.keys(RACES) as RaceKey[];
const CLASS_KEYS = Object.keys(CLASSES) as ClassKey[];
const DEITY_KEYS = Object.keys(DEITIES) as DeityKey[];

function formatModifiers(mods: Stats): string {
  const labels: Record<string, string> = { strength: "SIŁ", dexterity: "ZRĘ", vitality: "WYT", intellect: "INT" };
  return Object.entries(mods)
    .filter(([, v]) => v !== 0)
    .map(([key, v]) => `${v > 0 ? "+" : ""}${v} ${labels[key]}`)
    .join(", ") || "bez modyfikatorów";
}

export function CharacterCreationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [race, setRace] = useState<RaceKey>("HUMAN");
  const [classKey, setClassKey] = useState<ClassKey>("WARRIOR");
  const [deity, setDeity] = useState<DeityKey>("SOLARIS");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setPending(true);

    const response = await fetch("/api/character", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, race, class: classKey, deity }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok) {
      setErrors(data.errors ?? { form: "Nie udało się utworzyć bohatera." });
      return;
    }

    router.push("/character");
    router.refresh();
  }

  return (
    <div className="w-full max-w-lg rounded-lg border border-line bg-card p-8">
      <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">
        Tworzenie bohatera
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Imię (3–16 znaków)
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded border border-line bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
          />
          {errors.name && <span className="text-danger">{errors.name}</span>}
        </label>

        <div className="flex flex-col gap-1 text-sm text-muted">
          Rasa
          <select
            value={race}
            onChange={(e) => setRace(e.target.value as RaceKey)}
            className="rounded border border-line bg-background px-3 py-2 text-foreground"
          >
            {RACE_KEYS.map((key) => (
              <option key={key} value={key}>
                {RACES[key].name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">
            {formatModifiers(RACES[race].modifiers)} — {RACES[race].trait}
          </p>
          {errors.race && <span className="text-danger">{errors.race}</span>}
        </div>

        <div className="flex flex-col gap-1 text-sm text-muted">
          Klasa
          <select
            value={classKey}
            onChange={(e) => setClassKey(e.target.value as ClassKey)}
            className="rounded border border-line bg-background px-3 py-2 text-foreground"
          >
            {CLASS_KEYS.map((key) => (
              <option key={key} value={key}>
                {CLASSES[key].name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">
            {CLASSES[classKey].style} — mocna strona: {CLASSES[classKey].strongPoint}; słabość:{" "}
            {CLASSES[classKey].weakPoint}
          </p>
          {errors.class && <span className="text-danger">{errors.class}</span>}
        </div>

        <div className="flex flex-col gap-1 text-sm text-muted">
          Bóstwo
          <select
            value={deity}
            onChange={(e) => setDeity(e.target.value as DeityKey)}
            className="rounded border border-line bg-background px-3 py-2 text-foreground"
          >
            {DEITY_KEYS.map((key) => (
              <option key={key} value={key}>
                {DEITIES[key].name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">
            {DEITIES[deity].domain} — {DEITIES[deity].bonus}
          </p>
          {errors.deity && <span className="text-danger">{errors.deity}</span>}
        </div>

        {errors.form && <p className="text-sm text-danger">{errors.form}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded bg-accent px-4 py-2 font-semibold text-background disabled:opacity-60"
        >
          {pending ? "Tworzenie…" : "Stwórz bohatera"}
        </button>
      </form>
    </div>
  );
}
