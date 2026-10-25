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
  return new PrismaClient({
    adapter,
    // Domyślny maxWait dla $transaction w Prisma to tylko 2000ms – osobny limit od
    // connectionTimeoutMillis powyżej, ile Prisma czeka na START transakcji (slot),
    // zanim w ogóle zacznie. Przy chwilowym obciążeniu puli dawało to "Unable to
    // start a transaction in the given time" na KAŻDEJ transakcji w kodzie (nie
    // tylko settleExpedition/attackPlayer, które mają własne, jeszcze wyższe wartości),
    // mimo że pula dawała na połączenie 10s. Ustawione globalnie, żeby nie trzeba
    // było pamiętać o tym w każdym nowym $transaction w kodzie.
    transactionOptions: { maxWait: 10_000, timeout: 10_000 },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
