import "server-only";

import { prisma } from "./prisma";

/**
 * Własny log błędów serwera (docs/gdd/00-glowny.md: bez zewnętrznej
 * analityki – wszystko we własnej tabeli, tu reużyta game_events jak
 * zdarzenia gry). Nigdy nie rzuca – błąd w logowaniu nie może przykryć
 * prawdziwego błędu, który logujemy.
 */
export async function logServerError(context: string, error: unknown, extra?: Record<string, unknown>): Promise<void> {
  try {
    await prisma.gameEvent.create({
      data: {
        type: "blad-serwera",
        details: {
          context,
          message: error instanceof Error ? error.message : String(error),
          code: (error as { code?: string } | undefined)?.code ?? null,
          ...extra,
        },
      },
    });
  } catch {
    // Baza już ma problem (to ten sam typ błędu, który próbujemy zalogować) – nie ma gdzie tego zapisać, pomijamy.
  }
}

export interface MonitoringSnapshot {
  dbLatencyMs: number;
  dbOk: boolean;
  userCount: number;
  characterCount: number;
  activeCharactersLast24h: number;
  activeExpeditionsNow: number;
  recentErrors: { context: string; message: string; code: string | null; createdAt: Date }[];
  errorCountLastHour: number;
}

/** Zrzut stanu gry do panelu admina (docs/gdd/13-technika.md, "pomiar gry"). */
export async function getMonitoringSnapshot(): Promise<MonitoringSnapshot> {
  const dbStart = Date.now();
  let dbOk = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }
  const dbLatencyMs = Date.now() - dbStart;

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [userCount, characterCount, activeCharactersLast24h, activeExpeditionsNow, errorRows, errorCountLastHour] =
    await Promise.all([
      prisma.user.count(),
      prisma.character.count(),
      prisma.character.count({ where: { lastActiveAt: { gte: dayAgo } } }),
      prisma.expedition.count({ where: { settled: false } }),
      prisma.gameEvent.findMany({
        where: { type: "blad-serwera" },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.gameEvent.count({ where: { type: "blad-serwera", createdAt: { gte: hourAgo } } }),
    ]);

  return {
    dbLatencyMs,
    dbOk,
    userCount,
    characterCount,
    activeCharactersLast24h,
    activeExpeditionsNow,
    recentErrors: errorRows.map((e) => {
      const details = e.details as { context?: string; message?: string; code?: string | null };
      return {
        context: details.context ?? "?",
        message: details.message ?? "?",
        code: details.code ?? null,
        createdAt: e.createdAt,
      };
    }),
    errorCountLastHour,
  };
}
