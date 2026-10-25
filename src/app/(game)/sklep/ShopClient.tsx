"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface PotionView {
  key: string;
  name: string;
  kind: "COMBAT" | "INSTANT";
  effectText: string;
  price: number;
  owned: number;
}

export function ShopClient({
  potions,
  goldPouch,
  injured,
}: {
  potions: PotionView[];
  goldPouch: number;
  injured: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  async function buy(key: string) {
    setError(null);
    setPendingKey(key);
    const response = await fetch("/api/shop/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ potionKey: key, quantity: 1 }),
    });
    const data = await response.json().catch(() => ({}));
    setPendingKey(null);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się kupić mikstury.");
      return;
    }
    router.refresh();
  }

  async function use(key: string) {
    setError(null);
    setPendingKey(key);
    const response = await fetch("/api/potions/use", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ potionKey: key }),
    });
    const data = await response.json().catch(() => ({}));
    setPendingKey(null);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się użyć mikstury.");
      return;
    }
    router.refresh();
  }

  const combat = potions.filter((p) => p.kind === "COMBAT");
  const instantPotions = potions.filter((p) => p.kind === "INSTANT");

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Sklep</h1>
        <p className="mt-1 text-sm text-muted">
          Złoto: <span className="font-ui text-foreground">{goldPouch}</span>
        </p>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>

      <div className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">Mikstury bojowe (do pasa przed wyprawą)</h2>
        <div className="mt-3 flex flex-col gap-2">
          {combat.map((p) => (
            <div key={p.key} className="flex items-center justify-between gap-3 rounded border border-line p-3 text-sm">
              <div>
                <p className="text-foreground">
                  {p.name} <span className="text-xs text-muted">(masz: {p.owned})</span>
                </p>
                <p className="text-xs text-muted">{p.effectText}</p>
              </div>
              <button
                type="button"
                disabled={pendingKey === p.key || goldPouch < p.price}
                onClick={() => buy(p.key)}
                className="shrink-0 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
              >
                Kup za {p.price}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">Mikstury natychmiastowe</h2>
        <div className="mt-3 flex flex-col gap-2">
          {instantPotions.map((p) => {
            const canUse = p.owned > 0 && (p.key !== "mikstura-uzdrowienia" || injured);
            return (
              <div key={p.key} className="flex items-center justify-between gap-3 rounded border border-line p-3 text-sm">
                <div>
                  <p className="text-foreground">
                    {p.name} <span className="text-xs text-muted">(masz: {p.owned})</span>
                  </p>
                  <p className="text-xs text-muted">{p.effectText}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={pendingKey === p.key || goldPouch < p.price}
                    onClick={() => buy(p.key)}
                    className="rounded border border-line px-3 py-1.5 text-xs text-foreground disabled:opacity-40"
                  >
                    Kup za {p.price}
                  </button>
                  <button
                    type="button"
                    disabled={pendingKey === p.key || !canUse}
                    onClick={() => use(p.key)}
                    className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
                  >
                    Użyj
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
