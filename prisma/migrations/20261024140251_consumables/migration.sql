-- CreateTable
CREATE TABLE "consumables" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "consumables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consumables_characterId_kind_key" ON "consumables"("characterId", "kind");

-- AddForeignKey
ALTER TABLE "consumables" ADD CONSTRAINT "consumables_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
