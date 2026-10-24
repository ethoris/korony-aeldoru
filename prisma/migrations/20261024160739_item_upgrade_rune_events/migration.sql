-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ItemEventType" ADD VALUE 'UPGRADED';
ALTER TYPE "ItemEventType" ADD VALUE 'RUNE_APPLIED';

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "upgradeFailStreak" INTEGER NOT NULL DEFAULT 0;

