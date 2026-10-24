import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const startedAt = Date.now();

  try {
    const [{ now }] = await prisma.$queryRaw<{ now: Date }[]>`SELECT now()`;
    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: "ok",
      database: "connected",
      dbTime: now,
      userCount,
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Nieznany błąd",
      },
      { status: 503 },
    );
  }
}
