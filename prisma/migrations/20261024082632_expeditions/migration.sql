-- AlterTable
ALTER TABLE "battle_reports" ADD COLUMN     "expeditionId" TEXT;

-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "fightsSinceRareDrop" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "battle_reports_expeditionId_idx" ON "battle_reports"("expeditionId");

-- AddForeignKey
ALTER TABLE "battle_reports" ADD CONSTRAINT "battle_reports_expeditionId_fkey" FOREIGN KEY ("expeditionId") REFERENCES "expeditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

