import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getMonitoringSnapshot } from "@/lib/monitoring";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    return NextResponse.json({ error: "Brak uprawnień." }, { status: 403 });
  }
  return NextResponse.json(await getMonitoringSnapshot());
}
