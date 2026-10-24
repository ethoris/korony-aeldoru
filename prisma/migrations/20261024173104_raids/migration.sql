-- CreateEnum
CREATE TYPE "RaidResult" AS ENUM ('ATTACKER_WIN', 'DEFENDER_WIN');

-- CreateTable
CREATE TABLE "raids" (
    "id" TEXT NOT NULL,
    "attackerCharacterId" TEXT NOT NULL,
    "defenderCharacterId" TEXT NOT NULL,
    "army" JSONB NOT NULL,
    "arrivalAt" TIMESTAMP(3) NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "result" "RaidResult",
    "report" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "raids_attackerCharacterId_idx" ON "raids"("attackerCharacterId");

-- CreateIndex
CREATE INDEX "raids_defenderCharacterId_idx" ON "raids"("defenderCharacterId");

-- AddForeignKey
ALTER TABLE "raids" ADD CONSTRAINT "raids_attackerCharacterId_fkey" FOREIGN KEY ("attackerCharacterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raids" ADD CONSTRAINT "raids_defenderCharacterId_fkey" FOREIGN KEY ("defenderCharacterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
