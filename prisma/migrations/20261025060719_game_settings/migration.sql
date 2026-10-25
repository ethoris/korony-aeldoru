-- CreateTable
CREATE TABLE "game_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_settings_pkey" PRIMARY KEY ("id")
);
