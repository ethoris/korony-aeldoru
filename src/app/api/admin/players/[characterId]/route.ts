import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { editCharacter, getPlayerProfile } from "@/lib/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ characterId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    return NextResponse.json({ error: "Brak uprawnień." }, { status: 403 });
  }

  const { characterId } = await params;
  const profile = await getPlayerProfile(characterId);
  if (!profile) return NextResponse.json({ error: "Nie znaleziono postaci." }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function POST(request: Request, { params }: { params: Promise<{ characterId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });

  const { characterId } = await params;
  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason : "";
  const changes: Record<string, number> = {};
  for (const key of ["level", "experience", "goldPouch", "freePoints", "stamina"]) {
    if (typeof body?.[key] === "number") changes[key] = Math.round(body[key]);
  }

  const result = await editCharacter(session.user.id, characterId, changes, reason);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
