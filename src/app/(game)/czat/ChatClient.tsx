"use client";

import { useState } from "react";

interface MessageView {
  id: string;
  authorCharacterId: string;
  authorName: string;
  content: string;
  createdAt: string;
  containsLink: boolean;
}

type Channel = "GENERAL" | "TRADE" | "GUILD";

const CHANNEL_LABELS: Record<Channel, string> = { GENERAL: "Ogólny", TRADE: "Handlowy", GUILD: "Gildia" };

export function ChatClient({
  characterId,
  characterLevel,
  unlockLevel,
  hasGuild,
  guildId,
  initialGeneral,
  blocked,
}: {
  characterId: string;
  characterLevel: number;
  unlockLevel: number;
  hasGuild: boolean;
  guildId: string | null;
  initialGeneral: MessageView[];
  blocked: { characterId: string; name: string }[];
}) {
  const [channel, setChannel] = useState<Channel>("GENERAL");
  const [messages, setMessages] = useState<MessageView[]>(initialGeneral);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function loadChannel(next: Channel) {
    setChannel(next);
    setError(null);
    const url = next === "GUILD" ? `/api/chat?channel=GUILD&guildId=${guildId}` : `/api/chat?channel=${next}`;
    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));
    if (response.ok) setMessages(data.messages);
  }

  async function send() {
    setError(null);
    setPending(true);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, content }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Nie udało się wysłać.");
      return;
    }
    setContent("");
    await loadChannel(channel);
  }

  async function report(targetCharacterId: string) {
    const reason = window.prompt("Powód zgłoszenia:");
    if (!reason) return;
    await fetch("/api/chat/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetCharacterId, reason, channel }),
    });
  }

  async function block(targetCharacterId: string) {
    await fetch("/api/chat/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetCharacterId, action: "block" }),
    });
    await loadChannel(channel);
  }

  if (characterLevel < unlockLevel) {
    return (
      <div className="w-full max-w-2xl rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Czat</h1>
        <p className="mt-2 text-sm text-muted">Czat odblokowuje się od poziomu {unlockLevel}. Masz poziom {characterLevel}.</p>
      </div>
    );
  }

  const channels: Channel[] = hasGuild ? ["GENERAL", "TRADE", "GUILD"] : ["GENERAL", "TRADE"];

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">Czat</h1>
        <div className="mt-3 flex gap-2">
          {channels.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => loadChannel(c)}
              className={`rounded px-3 py-1.5 text-xs ${channel === c ? "bg-accent text-background" : "border border-line text-foreground"}`}
            >
              {CHANNEL_LABELS[c]}
            </button>
          ))}
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>

      <div className="rounded-lg border border-line bg-card p-5">
        <div className="flex max-h-96 flex-col gap-1 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-muted">Brak wiadomości.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="flex items-baseline justify-between gap-2 text-sm">
                <p className="text-foreground">
                  <span className="text-accent">{m.authorName}:</span> {m.content}
                </p>
                {m.authorCharacterId !== characterId && (
                  <span className="flex shrink-0 gap-1 text-xs text-muted">
                    <button type="button" onClick={() => report(m.authorCharacterId)} className="underline">
                      Zgłoś
                    </button>
                    <button type="button" onClick={() => block(m.authorCharacterId)} className="underline">
                      Blokuj
                    </button>
                  </span>
                )}
              </div>
            ))
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={300}
            className="flex-1 rounded border border-line bg-background px-2 py-1 text-sm text-foreground"
            placeholder="Wiadomość (maks. 300 znaków)"
          />
          <button
            type="button"
            disabled={pending || !content.trim()}
            onClick={send}
            className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
          >
            Wyślij
          </button>
        </div>
      </div>

      {blocked.length > 0 && (
        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground">Zablokowani</h2>
          <div className="mt-2 flex flex-col gap-1">
            {blocked.map((b) => (
              <p key={b.characterId} className="text-sm text-muted">
                {b.name}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
