import { config } from "dotenv";

// Next.js convention: secrets live in .env.local (gitignored), not .env.
config({ path: ".env.local" });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Prisma 7 CLI (migrate/introspect) talks to the database through this URL.
  // Use the unpooled connection here; the app itself connects via the pooled
  // DATABASE_URL through the Neon driver adapter in src/lib/prisma.ts.
  datasource: {
    url: process.env["DATABASE_URL_UNPOOLED"],
  },
});
