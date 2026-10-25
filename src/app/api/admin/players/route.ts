import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { searchPlayers } from "@/lib/admin";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    return NextResponse.json({ error: "Brak uprawnień." }, { status: 403 });
  }

  const query = new URL(request.url).searchParams.get("query") ?? "";
  const results = await searchPlayers(query);
  return NextResponse.json({ results });
}
