"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FieldErrors {
  email?: string;
  password?: string;
  ageConfirmed?: string;
  form?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setPending(true);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, ageConfirmed }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setErrors(data.errors ?? { form: "Rejestracja nie powiodła się." });
      setPending(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setPending(false);

    if (result?.error) {
      setErrors({ form: "Konto powstało, ale logowanie nie powiodło się. Zaloguj się ręcznie." });
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-card p-8">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">
          Rejestracja
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
            {errors.email && <span className="text-danger">{errors.email}</span>}
          </label>

          <label className="flex flex-col gap-1 text-sm text-muted">
            Hasło (min. 8 znaków)
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded border border-line bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
            />
            {errors.password && <span className="text-danger">{errors.password}</span>}
          </label>

          <label className="flex items-start gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-1"
            />
            <span>Mam ukończone 16 lat.</span>
          </label>
          {errors.ageConfirmed && <span className="text-sm text-danger">{errors.ageConfirmed}</span>}

          {errors.form && <p className="text-sm text-danger">{errors.form}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded bg-accent px-4 py-2 font-semibold text-background disabled:opacity-60"
          >
            {pending ? "Tworzenie konta…" : "Załóż konto"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Masz już konto?{" "}
          <Link href="/login" className="text-accent underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </main>
  );
}
