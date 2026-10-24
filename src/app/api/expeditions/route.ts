import { NextResponse } from "next/server";

import { auth } from "@/auth";
import type { ExpeditionKind, Tactic } from "@/game/combat/types";
import { getCharacterForUser, startExpedition, syncCharacter } from "@/lib/expeditions";

const VALID_KINDS: ExpeditionKind[] = ["SCOUT", "HUNT", "DEEP", "BOSS"];
const VALID_TACTICS: Tactic[] = ["AGGRESSIVE", "BALANCED", "DEFENSIVE", "RETREAT_30"];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  }

  const character = await getCharacterForUser(session.user.id);
  if (!character) {
    return NextResponse.json({ error: "Nie masz jeszcze bohatera." }, { status: 404 });
  }

  // Rozlicz ewentualną wcześniejszą wyprawę, zanim sprawdzimy, czy można zacząć nową.
  await syncCharacter(character.id);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const { locationKey, kind, tactic } = body as Record<string, unknown>;

  if (typeof locationKey !== "string") {
    return NextResponse.json({ error: "Wybierz lokację." }, { status: 400 });
  }
  if (typeof kind !== "string" || !VALID_KINDS.includes(kind as ExpeditionKind)) {
    return NextResponse.json({ error: "Nieprawidłowy rodzaj wyprawy." }, { status: 400 });
  }
  const resolvedTactic: Tactic =
    typeof tactic === "string" && VALID_TACTICS.includes(tactic as Tactic) ? (tactic as Tactic) : "BALANCED";

  const result = await startExpedition(character.id, locationKey, kind as ExpeditionKind, resolvedTactic);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, expeditionId: result.expeditionId, endAt: result.endAt });
}
