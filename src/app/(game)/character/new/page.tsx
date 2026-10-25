import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { CharacterCreationForm } from "./CharacterCreationForm";

// Cała strona zależy od sesji (przekierowania), więc nie da się jej
// prerenderować jako statyczny shell – blokujemy ją w całości po stronie serwera.
export const instant = false;

export default async function NewCharacterPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const existing = await prisma.character.findUnique({
    where: { userId_server: { userId: session.user.id, server: "Valmor" } },
  });
  if (existing) redirect("/character");

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <CharacterCreationForm />
    </main>
  );
}
