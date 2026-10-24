-- CreateTable
CREATE TABLE "armies" (
    "id" TEXT NOT NULL,
    "fortressId" TEXT NOT NULL,
    "unitKey" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "trainingQuantity" INTEGER NOT NULL DEFAULT 0,
    "trainingEndAt" TIMESTAMP(3),

    CONSTRAINT "armies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "armies_fortressId_unitKey_key" ON "armies"("fortressId", "unitKey");

-- AddForeignKey
ALTER TABLE "armies" ADD CONSTRAINT "armies_fortressId_fkey" FOREIGN KEY ("fortressId") REFERENCES "fortresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
