import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

import { PrismaClient } from "@/generated/prisma/client";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // KRYTYCZNE: bez connectionTimeoutMillis, @neondatabase/serverless Pool
  // (domyślnie max 10 połączeń) kolejkuje żądanie o połączenie BEZ ŻADNEGO
  // TIMEOUTU, gdy pula jest zajęta – stąd zawieszenia do 300s (twardy limit
  // Vercela) widoczne w produkcji na różnych, niepowiązanych trasach
  // (/expeditions, /inventory, /napady, /twierdza). Z timeoutem taka sytuacja
  // kończy się szybkim, czytelnym błędem połączenia zamiast wielominutowego
  // zawieszenia całej strony.
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
    connectionTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
