
-- CreateTable
CREATE TABLE "fortresses" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "buildingLevels" JSONB NOT NULL DEFAULT '{}',
    "wood" INTEGER NOT NULL DEFAULT 0,
    "stone" INTEGER NOT NULL DEFAULT 0,
    "iron" INTEGER NOT NULL DEFAULT 0,
    "food" INTEGER NOT NULL DEFAULT 0,
    "mana" INTEGER NOT NULL DEFAULT 0,
    "goldVault" INTEGER NOT NULL DEFAULT 0,
    "lastProductionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "protectionUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fortresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_queue" (
    "id" TEXT NOT NULL,
    "fortressId" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "targetLevel" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "build_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fortresses_characterId_key" ON "fortresses"("characterId");

-- CreateIndex
CREATE INDEX "build_queue_fortressId_idx" ON "build_queue"("fortressId");

-- AddForeignKey
ALTER TABLE "fortresses" ADD CONSTRAINT "fortresses_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_queue" ADD CONSTRAINT "build_queue_fortressId_fkey" FOREIGN KEY ("fortressId") REFERENCES "fortresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

