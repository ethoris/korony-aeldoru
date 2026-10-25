"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ClassKey, Element } from "@/game/combat/types";
import { MAX_UPGRADE_LEVEL, RUNE_ELEMENTS, RUNE_KUZNIA_LEVEL, UPGRADABLE_SLOTS, upgradeTier } from "@/game/items/upgrade";

interface Trait {
  key: string;
  value: number;
  label: string;
}

interface ItemView {
  id: string;
  name: string;
  slot: string;
  level: number;
  quality: string;
  forClass: ClassKey;
  damageMin: number | null;
  damageMax: number | null;
  armor: number | null;
  traits: Trait[];
  location: string;
  locked: boolean;
  upgrade: number;
  rune: string | null;
}

const RUNE_LABELS: Record<string, string> = {
  fire: "Ogień",
  ice: "Lód",
  lightning: "Błyskawica",
  light: "Światło",
  shadow: "Cień",
  poison: "Trucizna",
};

const SLOT_ORDER = ["WEAPON", "OFFHAND", "HELMET", "ARMOR", "GLOVES", "BOOTS", "AMULET", "RING"];
const SLOT_LABELS: Record<string, string> = {
  WEAPON: "Broń",
  OFFHAND: "Druga ręka",
  HELMET: "Hełm",
  ARMOR: "Zbroja",
  GLOVES: "Rękawice",
  BOOTS: "Buty",
  AMULET: "Amulet",
  RING: "Pierścień",
};

const QUALITY_CLASS: Record<string, string> = {
  COMMON: "text-rarity-common",
  MAGIC: "text-rarity-magic",
  RARE: "text-rarity-rare",
  LEGENDARY: "text-rarity-legendary",
};
const QUALITY_LABEL: Record<string, string> = {
  COMMON: "Zwykły",
  MAGIC: "Magiczny",
  RARE: "Rzadki",
  LEGENDARY: "Legendarny",
};

const FLAT_AFFIX_KEYS = new Set(["strength", "dexterity", "vitality", "intellect", "maxHp"]);

function powerValue(item: ItemView): number {
  if (item.damageMin != null && item.damageMax != null) return (item.damageMin + item.damageMax) / 2;
  if (item.armor != null) return item.armor;
  return item.traits.filter((t) => FLAT_AFFIX_KEYS.has(t.key)).reduce((sum, t) => sum + t.value, 0);
}

function statLine(item: ItemView): string {
  if (item.damageMin != null && item.damageMax != null) return `Obrażenia: ${item.damageMin}–${item.damageMax}`;
  if (item.armor != null) return `Pancerz: ${item.armor}`;
  return "—";
}

export function InventoryClient({
  items,
  characterClass,
  kuzniaLevel,
}: {
  items: ItemView[];
  characterClass: ClassKey;
  kuzniaLevel: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [runeChoice, setRuneChoice] = useState<Element>("fire");

  const equippedBySlot = new Map(items.filter((i) => i.location === "EQUIPPED").map((i) => [i.slot, i]));
  const backpack = items.filter((i) => i.location === "BACKPACK");

  async function act(itemId: string, action: "equip" | "unequip") {
    setError(null);
    setPendingId(itemId);
    const response = await fetch(`/api/items/${itemId}/${action}`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setPendingId(null);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się wykonać akcji.");
      return;
    }
    router.refresh();
  }

  async function upgrade(itemId: string) {
    setError(null);
    setPendingId(itemId);
    const response = await fetch("/api/forge/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    const data = await response.json().catch(() => ({}));
    setPendingId(null);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się ulepszyć przedmiotu.");
      return;
    }
    router.refresh();
  }

  async function rune(itemId: string, element: Element) {
    setError(null);
    setPendingId(itemId);
    const response = await fetch("/api/forge/rune", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, element }),
    });
    const data = await response.json().catch(() => ({}));
    setPendingId(null);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się nałożyć runy.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div className="rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Ekwipunek</h1>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SLOT_ORDER.map((slot) => {
            const item = equippedBySlot.get(slot);
            return (
              <div key={slot} className="rounded border border-line p-3 text-sm">
                <p className="text-xs text-muted">{SLOT_LABELS[slot]}</p>
                {item ? (
                  <>
                    <p className={QUALITY_CLASS[item.quality]}>
                      {item.name}
                      {item.upgrade > 0 && <span className="text-accent"> +{item.upgrade}</span>}
                    </p>
                    <p className="text-xs text-muted">
                      poz. {item.level} · {statLine(item)}
                    </p>
                    {item.slot === "WEAPON" && item.rune && (
                      <p className="text-xs text-muted">Runa: {RUNE_LABELS[item.rune] ?? item.rune}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
                      <button
                        type="button"
                        disabled={pendingId === item.id}
                        onClick={() => act(item.id, "unequip")}
                        className="rounded border border-line px-2 py-1 text-xs text-foreground disabled:opacity-40"
                      >
                        Zdejmij
                      </button>
                      {UPGRADABLE_SLOTS.includes(item.slot as (typeof UPGRADABLE_SLOTS)[number]) && (
                        <button
                          type="button"
                          disabled={
                            pendingId === item.id ||
                            item.upgrade >= MAX_UPGRADE_LEVEL ||
                            kuzniaLevel < (upgradeTier(item.upgrade + 1)?.kuzniaLevelRequired ?? 99)
                          }
                          onClick={() => upgrade(item.id)}
                          title={`Kuźnia poz. ${upgradeTier(item.upgrade + 1)?.kuzniaLevelRequired ?? "?"} wymagana`}
                          className="rounded bg-accent px-2 py-1 text-xs font-semibold text-background disabled:opacity-40"
                        >
                          Ulepsz (+{item.upgrade + 1})
                        </button>
                      )}
                    </div>
                    {item.slot === "WEAPON" && (
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <select
                          value={runeChoice}
                          onChange={(e) => setRuneChoice(e.target.value as Element)}
                          className="rounded border border-line bg-background px-1 py-1 text-xs text-foreground"
                        >
                          {RUNE_ELEMENTS.map((el) => (
                            <option key={el} value={el}>
                              {RUNE_LABELS[el]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={pendingId === item.id || kuzniaLevel < RUNE_KUZNIA_LEVEL}
                          onClick={() => rune(item.id, runeChoice)}
                          title={`Kuźnia poz. ${RUNE_KUZNIA_LEVEL} wymagana`}
                          className="rounded border border-line px-2 py-1 text-xs text-foreground disabled:opacity-40"
                        >
                          Nałóż runę
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted">—</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-card p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
          Plecak ({backpack.length})
        </h2>

        {backpack.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Plecak jest pusty.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {backpack.map((item) => {
              const equipped = equippedBySlot.get(item.slot);
              const delta = equipped ? powerValue(item) - powerValue(equipped) : null;
              const matchesClass = item.forClass === characterClass;
              return (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded border border-line p-3 text-sm">
                  <div>
                    <p className={QUALITY_CLASS[item.quality]}>
                      {item.name}{" "}
                      <span className="text-xs text-muted">
                        ({QUALITY_LABEL[item.quality]}, poz. {item.level})
                      </span>
                    </p>
                    <p className="text-xs text-muted">
                      {SLOT_LABELS[item.slot]} · {statLine(item)}
                      {!matchesClass && " · inna klasa"}
                    </p>
                    {delta !== null && delta !== 0 && (
                      <p className={delta > 0 ? "text-xs text-success" : "text-xs text-danger"}>
                        {delta > 0 ? "▲" : "▼"} {Math.abs(Math.round(delta))} względem założonego
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={pendingId === item.id || item.locked}
                    onClick={() => act(item.id, "equip")}
                    className="shrink-0 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
                  >
                    Załóż
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
