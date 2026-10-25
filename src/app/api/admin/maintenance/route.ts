import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getMaintenanceMode, setMaintenanceMode } from "@/lib/admin";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    return NextResponse.json({ error: "Brak uprawnień." }, { status: 403 });
  }
  return NextResponse.json(await getMaintenanceMode());
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const enabled = Boolean(body?.enabled);
  const message = typeof body?.message === "string" ? body.message : "";
  const reason = typeof body?.reason === "string" ? body.reason : "";

  const result = await setMaintenanceMode(session.user.id, enabled, message, reason);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
