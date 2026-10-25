import { neon } from "@neondatabase/serverless";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

// Edge Runtime: NIE importować @/auth ani @/lib/prisma tutaj – dostawca
// Credentials używa node:crypto (src/lib/password.ts), a klient Prisma
// pakietu "ws" (src/lib/prisma.ts), żadne z nich nie działa poza Node.js.
// Middleware potrzebuje tylko roli z tokenu JWT (authConfig bez dostawców)
// i jednego surowego zapytania SQL przez HTTP (bez Prisma/ws).
const { auth } = NextAuth(authConfig);
const sql = neon(process.env.DATABASE_URL!);

const ALLOWED_PREFIXES = ["/przerwa", "/login", "/regulamin", "/polityka-prywatnosci", "/api/auth", "/_next", "/favicon.ico"];

/** Tryb przerwy technicznej (docs/gdd/13-technika.md): logowanie tylko dla admina/moderatora. */
export default auth(async (request) => {
  const { pathname } = request.nextUrl;
  if (ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const role = request.auth?.user?.role;
  if (role === "ADMIN" || role === "MODERATOR") return NextResponse.next();

  try {
    const rows = await sql`SELECT "maintenanceMode" FROM "game_settings" WHERE "id" = 1`;
    const maintenanceMode = Boolean((rows[0] as { maintenanceMode?: boolean } | undefined)?.maintenanceMode);
    if (maintenanceMode) {
      const url = request.nextUrl.clone();
      url.pathname = "/przerwa";
      return NextResponse.rewrite(url);
    }
  } catch {
    // Awaria sprawdzenia trybu przerwy nie może zablokować całej gry – przepuszczamy.
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
