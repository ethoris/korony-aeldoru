-- CreateEnum
CREATE TYPE "ChatChannel" AS ENUM ('GENERAL', 'TRADE', 'GUILD', 'DM');

-- CreateEnum
CREATE TYPE "SanctionType" AS ENUM ('MUTE', 'TRADE_BAN', 'ACCOUNT_BAN');

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "channel" "ChatChannel" NOT NULL,
    "authorCharacterId" TEXT NOT NULL,
    "guildId" TEXT,
    "recipientCharacterId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_blocks" (
    "id" TEXT NOT NULL,
    "blockerCharacterId" TEXT NOT NULL,
    "blockedCharacterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterCharacterId" TEXT NOT NULL,
    "targetCharacterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "contextSnapshot" JSONB NOT NULL DEFAULT '[]',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolution" TEXT,
    "resolvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sanctions" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "type" "SanctionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sanctions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_messages_channel_createdAt_idx" ON "chat_messages"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_guildId_idx" ON "chat_messages"("guildId");

-- CreateIndex
CREATE INDEX "chat_messages_authorCharacterId_recipientCharacterId_idx" ON "chat_messages"("authorCharacterId", "recipientCharacterId");

-- CreateIndex
CREATE UNIQUE INDEX "player_blocks_blockerCharacterId_blockedCharacterId_key" ON "player_blocks"("blockerCharacterId", "blockedCharacterId");

-- CreateIndex
CREATE INDEX "reports_targetCharacterId_idx" ON "reports"("targetCharacterId");

-- CreateIndex
CREATE INDEX "reports_resolved_idx" ON "reports"("resolved");

-- CreateIndex
CREATE INDEX "sanctions_characterId_type_idx" ON "sanctions"("characterId", "type");

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_authorCharacterId_fkey" FOREIGN KEY ("authorCharacterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_recipientCharacterId_fkey" FOREIGN KEY ("recipientCharacterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_blocks" ADD CONSTRAINT "player_blocks_blockerCharacterId_fkey" FOREIGN KEY ("blockerCharacterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_blocks" ADD CONSTRAINT "player_blocks_blockedCharacterId_fkey" FOREIGN KEY ("blockedCharacterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterCharacterId_fkey" FOREIGN KEY ("reporterCharacterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_targetCharacterId_fkey" FOREIGN KEY ("targetCharacterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
