-- CreateEnum
CREATE TYPE "GuildRole" AS ENUM ('LEADER', 'MEMBER');

-- CreateTable
CREATE TABLE "guilds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "tagKey" TEXT NOT NULL,
    "leaderCharacterId" TEXT NOT NULL,
    "treasuryGold" INTEGER NOT NULL DEFAULT 0,
    "nameChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guild_members" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "role" "GuildRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guild_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guilds_nameKey_key" ON "guilds"("nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "guilds_tagKey_key" ON "guilds"("tagKey");

-- CreateIndex
CREATE UNIQUE INDEX "guilds_leaderCharacterId_key" ON "guilds"("leaderCharacterId");

-- CreateIndex
CREATE UNIQUE INDEX "guild_members_characterId_key" ON "guild_members"("characterId");

-- CreateIndex
CREATE INDEX "guild_members_guildId_idx" ON "guild_members"("guildId");

-- AddForeignKey
ALTER TABLE "guilds" ADD CONSTRAINT "guilds_leaderCharacterId_fkey" FOREIGN KEY ("leaderCharacterId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_members" ADD CONSTRAINT "guild_members_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_members" ADD CONSTRAINT "guild_members_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
