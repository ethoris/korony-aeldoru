-- AlterEnum
ALTER TYPE "ItemLocation" ADD VALUE 'MARKET';

-- CreateTable
CREATE TABLE "market_offers" (
    "id" TEXT NOT NULL,
    "sellerCharacterId" TEXT NOT NULL,
    "itemId" TEXT,
    "resourceKey" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "buyerCharacterId" TEXT,
    "soldAt" TIMESTAMP(3),

    CONSTRAINT "market_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "market_offers_itemId_key" ON "market_offers"("itemId");

-- CreateIndex
CREATE INDEX "market_offers_sellerCharacterId_idx" ON "market_offers"("sellerCharacterId");

-- AddForeignKey
ALTER TABLE "market_offers" ADD CONSTRAINT "market_offers_sellerCharacterId_fkey" FOREIGN KEY ("sellerCharacterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_offers" ADD CONSTRAINT "market_offers_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_offers" ADD CONSTRAINT "market_offers_buyerCharacterId_fkey" FOREIGN KEY ("buyerCharacterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
