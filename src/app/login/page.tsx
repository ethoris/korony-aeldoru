"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setPending(false);

    if (result?.error) {
      setError("Nieprawidłowy e-mail lub hasło.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-card p-8">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">
          Logowanie
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-muted">
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded border border-line bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-muted">
            Hasło
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded border border-line bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
            />
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded bg-accent px-4 py-2 font-semibold text-background disabled:opacity-60"
          >
            {pending ? "Logowanie…" : "Zaloguj się"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Nie masz konta?{" "}
          <Link href="/register" className="text-accent underline">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </main>
  );
}
