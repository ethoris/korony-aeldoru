"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface BuildingView {
  key: string;
  name: string;
  currentLevel: number;
  maxLevel: number;
  cost: { wood: number; stone: number; iron: number; gold: number } | null;
  timeMinutes: number | null;
  producesResource: string | null;
}

interface QueueView {
  building: string;
  targetLevel: number;
  endAt: string;
}

interface UnitView {
  key: string;
  name: string;
  koszaryLevelRequired: number;
  unlocked: boolean;
  cost: { wood: number; iron: number; food: number; gold: number; mana?: number };
  trainingMinutesPerUnit: number;
  quantity: number;
  trainingQuantity: number;
  trainingEndAt: string | null;
}

const RESOURCE_NAMES: Record<string, string> = { wood: "drewno", stone: "kamień", iron: "żelazo", food: "żywność", mana: "mana" };

export function FortressClient({
  founded,
  characterLevel,
  unlockLevel,
  goldPouch,
  resources,
  goldVault,
  queue,
  buildings,
  units,
  armyLimit,
}: {
  founded: boolean;
  characterLevel: number;
  unlockLevel: number;
  goldPouch: number;
  resources: { wood: number; stone: number; iron: number; food: number; mana: number } | null;
  goldVault: number;
  queue: QueueView[];
  buildings: BuildingView[];
  units: UnitView[];
  armyLimit: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [vaultAmount, setVaultAmount] = useState(100);
  const [trainQuantity, setTrainQuantity] = useState(1);

  async function found() {
    setError(null);
    setPending(true);
    const response = await fetch("/api/fortress", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się założyć twierdzy.");
      return;
    }
    router.refresh();
  }

  async function build(key: string) {
    setError(null);
    setPending(true);
    const response = await fetch("/api/fortress/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ building: key }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się rozpocząć budowy.");
      return;
    }
    router.refresh();
  }

  async function vault(direction: "deposit" | "withdraw") {
    setError(null);
    setPending(true);
    const response = await fetch("/api/fortress/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction, amount: vaultAmount }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się przenieść złota.");
      return;
    }
    router.refresh();
  }

  async function train(unitKey: string, quantity: number) {
    setError(null);
    setPending(true);
    const response = await fetch("/api/fortress/train", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitKey, quantity }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się rozpocząć szkolenia.");
      return;
    }
    router.refresh();
  }

  if (!founded) {
    return (
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <div className="rounded-lg border border-line bg-card p-6">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Twierdza</h1>
          {characterLevel < unlockLevel ? (
            <p className="mt-2 text-sm text-muted">Twierdzę założysz od poziomu {unlockLevel}. Masz poziom {characterLevel}.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted">
                Nie masz jeszcze twierdzy. Założenie da Ratusz poziomu 1 i mały pakiet surowców na pierwsze budynki.
              </p>
              {error && <p className="mt-2 text-sm text-danger">{error}</p>}
              <button
                type="button"
                disabled={pending}
                onClick={found}
                className="mt-3 rounded bg-accent px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
              >
                Załóż twierdzę
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Twierdza</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-foreground">
          {resources &&
            Object.entries(resources).map(([key, value]) => (
              <span key={key}>
                {RESOURCE_NAMES[key]}: <strong>{value}</strong>
              </span>
            ))}
        </div>
        <p className="mt-1 text-sm text-muted">
          Złoto w sakwie: <span className="text-foreground">{goldPouch}</span> · Skarbiec:{" "}
          <span className="text-foreground">{goldVault}</span>
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={vaultAmount}
            onChange={(e) => setVaultAmount(Math.max(1, Number(e.target.value) || 0))}
            className="w-24 rounded border border-line bg-background px-2 py-1 text-sm text-foreground"
          />
          <button type="button" disabled={pending} onClick={() => vault("deposit")} className="rounded border border-line px-3 py-1.5 text-xs text-foreground disabled:opacity-40">
            Wpłać do skarbca
          </button>
          <button type="button" disabled={pending} onClick={() => vault("withdraw")} className="rounded border border-line px-3 py-1.5 text-xs text-foreground disabled:opacity-40">
            Wypłać
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>

      {queue.length > 0 && (
        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground">Kolejka budowy</h2>
          {queue.map((q) => (
            <p key={q.building} className="mt-1 text-sm text-muted">
              {q.building} → poz. {q.targetLevel}, koniec: {new Date(q.endAt).toLocaleString("pl-PL")}
            </p>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">Budynki</h2>
        <div className="mt-3 flex flex-col gap-2">
          {buildings.map((b) => (
            <div key={b.key} className="flex items-center justify-between gap-3 rounded border border-line p-3 text-sm">
              <div>
                <p className="text-foreground">
                  {b.name} <span className="text-xs text-muted">(poz. {b.currentLevel}/{b.maxLevel})</span>
                </p>
                {b.cost && (
                  <p className="text-xs text-muted">
                    Koszt: {b.cost.wood} drewna, {b.cost.stone} kamienia, {b.cost.iron} żelaza, {b.cost.gold} złota · {Math.round((b.timeMinutes ?? 0) * 10) / 10} min
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={pending || !b.cost || queue.length > 0}
                onClick={() => build(b.key)}
                className="shrink-0 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
              >
                Buduj poz. {b.currentLevel + 1}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">Koszary (wojsko)</h2>
        <p className="mt-1 text-xs text-muted">
          Limit wojska: {units.reduce((sum, u) => sum + u.quantity + u.trainingQuantity, 0)}/{armyLimit}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <label className="text-xs text-muted" htmlFor="train-quantity">
            Liczba:
          </label>
          <input
            id="train-quantity"
            type="number"
            min={1}
            value={trainQuantity}
            onChange={(e) => setTrainQuantity(Math.max(1, Number(e.target.value) || 0))}
            className="w-20 rounded border border-line bg-background px-2 py-1 text-sm text-foreground"
          />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {units.map((u) => (
            <div key={u.key} className="flex items-center justify-between gap-3 rounded border border-line p-3 text-sm">
              <div>
                <p className="text-foreground">
                  {u.name} <span className="text-xs text-muted">(masz: {u.quantity})</span>
                </p>
                {u.unlocked ? (
                  <p className="text-xs text-muted">
                    Koszt/szt: {u.cost.wood} drewna, {u.cost.iron} żelaza, {u.cost.food} żywności, {u.cost.gold} złota
                    {u.cost.mana ? `, ${u.cost.mana} many` : ""} · {u.trainingMinutesPerUnit} min/szt
                  </p>
                ) : (
                  <p className="text-xs text-muted">Wymaga Koszar poziomu {u.koszaryLevelRequired}.</p>
                )}
                {u.trainingQuantity > 0 && u.trainingEndAt && (
                  <p className="text-xs text-accent">
                    Szkoli się: {u.trainingQuantity}, koniec {new Date(u.trainingEndAt).toLocaleString("pl-PL")}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={pending || !u.unlocked || u.trainingQuantity > 0}
                onClick={() => train(u.key, trainQuantity)}
                className="shrink-0 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
              >
                Szkol
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
