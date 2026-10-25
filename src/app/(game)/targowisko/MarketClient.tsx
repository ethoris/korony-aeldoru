"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface OfferView {
  id: string;
  sellerName: string;
  kind: "item" | "resource";
  itemName: string | null;
  itemQuality: string | null;
  resourceKey: string | null;
  quantity: number;
  price: number;
  expiresAt: string;
}

interface SellableItem {
  id: string;
  name: string;
  quality: string;
  level: number;
}

const RESOURCE_NAMES: Record<string, string> = { wood: "drewno", stone: "kamień", iron: "żelazo", food: "żywność", mana: "mana" };
const RESOURCES = ["wood", "stone", "iron", "food", "mana"];

export function MarketClient({
  goldPouch,
  offers,
  myOffers,
  sellableItems,
}: {
  goldPouch: number;
  offers: OfferView[];
  myOffers: OfferView[];
  sellableItems: SellableItem[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [itemId, setItemId] = useState(sellableItems[0]?.id ?? "");
  const [itemPrice, setItemPrice] = useState(100);
  const [resourceKey, setResourceKey] = useState("wood");
  const [resourceQty, setResourceQty] = useState(100);
  const [resourcePrice, setResourcePrice] = useState(50);

  async function call(url: string, body: unknown) {
    setError(null);
    setPending(true);
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się wykonać akcji.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div className="rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Targowisko</h1>
        <p className="mt-1 text-sm text-muted">Złoto: {goldPouch}</p>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>

      <div className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">Wystaw przedmiot</h2>
        {sellableItems.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nie masz przedmiotów do sprzedania w plecaku.</p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="rounded border border-line bg-background px-2 py-1 text-sm text-foreground">
              {sellableItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.quality}, poz. {i.level})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={itemPrice}
              onChange={(e) => setItemPrice(Math.max(1, Number(e.target.value) || 0))}
              className="w-24 rounded border border-line bg-background px-2 py-1 text-sm text-foreground"
            />
            <button
              type="button"
              disabled={pending || !itemId}
              onClick={() => call("/api/market", { itemId, price: itemPrice })}
              className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
            >
              Wystaw
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">Wystaw surowiec (z twierdzy)</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select value={resourceKey} onChange={(e) => setResourceKey(e.target.value)} className="rounded border border-line bg-background px-2 py-1 text-sm text-foreground">
            {RESOURCES.map((r) => (
              <option key={r} value={r}>
                {RESOURCE_NAMES[r]}
              </option>
            ))}
          </select>
          <input type="number" min={1} value={resourceQty} onChange={(e) => setResourceQty(Math.max(1, Number(e.target.value) || 0))} className="w-24 rounded border border-line bg-background px-2 py-1 text-sm text-foreground" />
          <input type="number" min={1} value={resourcePrice} onChange={(e) => setResourcePrice(Math.max(1, Number(e.target.value) || 0))} className="w-24 rounded border border-line bg-background px-2 py-1 text-sm text-foreground" />
          <button
            type="button"
            disabled={pending}
            onClick={() => call("/api/market", { resourceKey, quantity: resourceQty, price: resourcePrice })}
            className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
          >
            Wystaw
          </button>
        </div>
      </div>

      {myOffers.length > 0 && (
        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground">Twoje oferty</h2>
          <div className="mt-2 flex flex-col gap-2">
            {myOffers.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 rounded border border-line p-3 text-sm">
                <span className="text-foreground">
                  {o.kind === "item" ? o.itemName : `${o.quantity} × ${RESOURCE_NAMES[o.resourceKey ?? ""]}`} — {o.price} złota
                </span>
                <button type="button" disabled={pending} onClick={() => call("/api/market/cancel", { offerId: o.id })} className="rounded border border-danger px-2 py-1 text-xs text-danger disabled:opacity-40">
                  Wycofaj
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-line bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">Oferty</h2>
        {offers.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Brak ofert.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {offers.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 rounded border border-line p-3 text-sm">
                <span className="text-foreground">
                  {o.kind === "item" ? o.itemName : `${o.quantity} × ${RESOURCE_NAMES[o.resourceKey ?? ""]}`}{" "}
                  <span className="text-xs text-muted">od {o.sellerName}</span>
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => call("/api/market/buy", { offerId: o.id })}
                  className="shrink-0 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
                >
                  Kup za {o.price}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
