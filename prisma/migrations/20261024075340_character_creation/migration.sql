-- DropIndex
DROP INDEX "characters_name_key";

-- DropIndex
DROP INDEX "characters_userId_idx";

-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "nameKey" TEXT NOT NULL,
ADD COLUMN     "usedFreeResetAfter20" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "stat_reset_events" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL,
    "goldCost" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stat_reset_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stat_reset_events_characterId_createdAt_idx" ON "stat_reset_events"("characterId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "characters_server_nameKey_key" ON "characters"("server", "nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "characters_userId_server_key" ON "characters"("userId", "server");

-- AddForeignKey
ALTER TABLE "stat_reset_events" ADD CONSTRAINT "stat_reset_events_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

