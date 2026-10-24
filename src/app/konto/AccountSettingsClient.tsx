"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export function AccountSettingsClient({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordPending, setPasswordPending] = useState(false);

  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setPasswordPending(true);

    const response = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await response.json().catch(() => ({}));
    setPasswordPending(false);

    if (!response.ok) {
      setPasswordError(data.error ?? "Nie udało się zmienić hasła.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setPasswordSuccess("Hasło zmienione.");
  }

  async function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteError(null);

    if (!deleteConfirmed) {
      setDeleteError("Musisz potwierdzić, że rozumiesz, że to nieodwracalne.");
      return;
    }

    setDeletePending(true);
    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setDeletePending(false);
      setDeleteError(data.error ?? "Nie udało się usunąć konta.");
      return;
    }

    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="rounded-lg border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">
          Ustawienia konta
        </h1>
        <p className="mt-1 text-sm text-muted">
          Zalogowano jako <span className="text-foreground">{email}</span>
        </p>
      </div>

      <div className="rounded-lg border border-line bg-card p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
          Zmiana hasła
        </h2>
        <form onSubmit={handlePasswordSubmit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-muted">
            Obecne hasło
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="rounded border border-line bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted">
            Nowe hasło (min. 8 znaków)
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded border border-line bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
            />
          </label>

          {passwordError && <p className="text-sm text-danger">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-success">{passwordSuccess}</p>}

          <button
            type="submit"
            disabled={passwordPending}
            className="mt-1 rounded bg-accent px-4 py-2 font-semibold text-background disabled:opacity-60"
          >
            {passwordPending ? "Zapisywanie…" : "Zmień hasło"}
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-danger/50 bg-card p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-danger">
          Usunięcie konta
        </h2>
        <p className="mt-2 text-sm text-muted">
          Usuwa konto i wszystkie dane bohatera (statystyki, przedmioty, raporty, zadania) bez
          możliwości odzyskania. Zasady opisuje{" "}
          <Link href="/polityka-prywatnosci" className="text-accent underline">
            polityka prywatności
          </Link>
          .
        </p>

        {!showDeleteForm ? (
          <button
            type="button"
            onClick={() => setShowDeleteForm(true)}
            className="mt-4 rounded border border-danger px-4 py-2 text-sm text-danger"
          >
            Usuń konto
          </button>
        ) : (
          <form onSubmit={handleDelete} className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm text-muted">
              Hasło
              <input
                type="password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="rounded border border-line bg-background px-3 py-2 text-foreground outline-none focus:border-danger"
              />
            </label>
            <label className="flex items-start gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={deleteConfirmed}
                onChange={(e) => setDeleteConfirmed(e.target.checked)}
                className="mt-1"
              />
              <span>Rozumiem, że to nieodwracalne i usunie wszystkie dane bohatera.</span>
            </label>

            {deleteError && <p className="text-sm text-danger">{deleteError}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={deletePending}
                className="rounded bg-danger px-4 py-2 font-semibold text-background disabled:opacity-60"
              >
                {deletePending ? "Usuwanie…" : "Potwierdź usunięcie"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteForm(false)}
                className="rounded border border-line px-4 py-2 text-foreground"
              >
                Zamknij
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
