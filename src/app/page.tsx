import Link from "next/link";
import { Suspense } from "react";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

async function AccountStatus() {
  const session = await auth();

  if (session?.user) {
    const character = await prisma.character.findUnique({
      where: { userId_server: { userId: session.user.id, server: "Valmor" } },
      select: { name: true },
    });

    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-muted">
          Zalogowano jako <span className="text-foreground">{session.user.email}</span>
        </p>

        <Link href={character ? "/character" : "/character/new"} className="rounded bg-accent px-6 py-3 font-semibold text-background">
          {character ? `Twój bohater: ${character.name}` : "Stwórz bohatera"}
        </Link>

        <div className="flex gap-3">
          <Link href="/konto" className="rounded border border-line px-4 py-2 text-sm text-muted hover:text-foreground">
            Konto
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded border border-line px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              Wyloguj się
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link href="/login" className="rounded bg-accent px-6 py-3 font-semibold text-background">
        Zaloguj się
      </Link>
      <Link
        href="/register"
        className="rounded border border-line px-6 py-3 font-semibold text-foreground"
      >
        Załóż konto
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-4 text-center">
      <div>
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide text-accent sm:text-5xl">
          Korony Aeldoru
        </h1>
        <p className="font-body mt-4 max-w-md text-lg text-foreground">
          Tekstowa gra MMORPG fantasy. Twórz bohatera, ruszaj na wyprawy i czytaj
          barwne raporty z walk na kontynencie Aeldor.
        </p>
      </div>

      <Suspense fallback={<div className="h-11" />}>
        <AccountStatus />
      </Suspense>
    </main>
  );
}
