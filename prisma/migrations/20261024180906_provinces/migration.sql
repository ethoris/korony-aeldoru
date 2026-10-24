-- CreateEnum
CREATE TYPE "SiegeResult" AS ENUM ('ATTACKER_WIN', 'DEFENDER_WIN');

-- CreateTable
CREATE TABLE "province_states" (
    "id" TEXT NOT NULL,
    "provinceKey" TEXT NOT NULL,
    "ownerCharacterId" TEXT,
    "capturedAt" TIMESTAMP(3),
    "protectionUntil" TIMESTAMP(3),

    CONSTRAINT "province_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sieges" (
    "id" TEXT NOT NULL,
    "provinceKey" TEXT NOT NULL,
    "attackerCharacterId" TEXT NOT NULL,
    "army" JSONB NOT NULL,
    "announcedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "battleAt" TIMESTAMP(3) NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "result" "SiegeResult",
    "report" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "sieges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "siege_reinforcements" (
    "id" TEXT NOT NULL,
    "siegeId" TEXT NOT NULL,
    "defenderCharacterId" TEXT NOT NULL,
    "army" JSONB NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "siege_reinforcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "province_states_provinceKey_key" ON "province_states"("provinceKey");

-- CreateIndex
CREATE INDEX "sieges_provinceKey_idx" ON "sieges"("provinceKey");

-- CreateIndex
CREATE INDEX "siege_reinforcements_siegeId_idx" ON "siege_reinforcements"("siegeId");

-- AddForeignKey
ALTER TABLE "province_states" ADD CONSTRAINT "province_states_ownerCharacterId_fkey" FOREIGN KEY ("ownerCharacterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sieges" ADD CONSTRAINT "sieges_attackerCharacterId_fkey" FOREIGN KEY ("attackerCharacterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siege_reinforcements" ADD CONSTRAINT "siege_reinforcements_siegeId_fkey" FOREIGN KEY ("siegeId") REFERENCES "sieges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
