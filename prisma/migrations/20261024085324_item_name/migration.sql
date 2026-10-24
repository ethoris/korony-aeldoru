-- AlterTable
ALTER TABLE "items" ADD COLUMN "name" TEXT;

-- Backfill: istniejące przedmioty (sprzed dodania kolumny name) dostają
-- nazwę generyczną ze slotu i jakości, żeby kolumna mogła być NOT NULL.
UPDATE "items" SET "name" = INITCAP(LOWER("slot"::text)) || ' (' || "quality"::text || ')' WHERE "name" IS NULL;

ALTER TABLE "items" ALTER COLUMN "name" SET NOT NULL;
