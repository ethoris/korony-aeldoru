import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { listReports, resolveReport } from "@/lib/chat";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  if (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Brak uprawnień." }, { status: 403 });
  }

  const reports = await listReports();
  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const reportId = typeof body?.reportId === "string" ? body.reportId : "";
  const resolution = typeof body?.resolution === "string" ? body.resolution : "";
  if (!reportId) return NextResponse.json({ error: "Nieprawidłowe zgłoszenie." }, { status: 400 });

  const result = await resolveReport(session.user.id, reportId, resolution);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 403 });
  return NextResponse.json(result);
}
