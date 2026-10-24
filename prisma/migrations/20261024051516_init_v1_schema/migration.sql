-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PLAYER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "Race" AS ENUM ('HUMAN', 'ELF', 'DWARF', 'ORC', 'HALFLING', 'DRAGONBORN');

-- CreateEnum
CREATE TYPE "Class" AS ENUM ('WARRIOR', 'PALADIN', 'ARCHER', 'ROGUE', 'MAGE', 'PRIEST');

-- CreateEnum
CREATE TYPE "Deity" AS ENUM ('SOLARIS', 'KORGATH', 'ILYRA', 'VEYL', 'MARDUN', 'THESSA', 'MORRAK');

-- CreateEnum
CREATE TYPE "ItemSlot" AS ENUM ('WEAPON', 'OFFHAND', 'HELMET', 'ARMOR', 'GLOVES', 'BOOTS', 'AMULET', 'RING');

-- CreateEnum
CREATE TYPE "ItemQuality" AS ENUM ('COMMON', 'MAGIC', 'RARE', 'LEGENDARY', 'SET', 'UNIQUE');

-- CreateEnum
CREATE TYPE "ItemLocation" AS ENUM ('EQUIPPED', 'BACKPACK', 'STASH', 'MAIL');

-- CreateEnum
CREATE TYPE "ExpeditionKind" AS ENUM ('SCOUT', 'HUNT', 'DEEP', 'BOSS');

-- CreateEnum
CREATE TYPE "Tactic" AS ENUM ('AGGRESSIVE', 'BALANCED', 'DEFENSIVE', 'RETREAT_30');

-- CreateEnum
CREATE TYPE "BattleResult" AS ENUM ('WIN', 'LOSE', 'DRAW', 'RETREAT');

-- CreateEnum
CREATE TYPE "ItemEventType" AS ENUM ('CREATED', 'MOVED', 'EQUIPPED', 'UNEQUIPPED', 'SOLD', 'TRADED', 'EXPIRED', 'RESTORED', 'DELETED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "ageConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "premiumUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "server" TEXT NOT NULL DEFAULT 'Valmor',
    "name" TEXT NOT NULL,
    "race" "Race" NOT NULL,
    "class" "Class" NOT NULL,
    "deity" "Deity" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "strength" INTEGER NOT NULL DEFAULT 10,
    "dexterity" INTEGER NOT NULL DEFAULT 10,
    "vitality" INTEGER NOT NULL DEFAULT 10,
    "intellect" INTEGER NOT NULL DEFAULT 10,
    "freePoints" INTEGER NOT NULL DEFAULT 0,
    "goldPouch" INTEGER NOT NULL DEFAULT 0,
    "fame" INTEGER NOT NULL DEFAULT 1000,
    "stamina" INTEGER NOT NULL DEFAULT 100,
    "staminaUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "injuredUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "name_history" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "oldName" TEXT NOT NULL,
    "newName" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "forcedByMod" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "name_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "templateKey" TEXT,
    "slot" "ItemSlot" NOT NULL,
    "level" INTEGER NOT NULL,
    "quality" "ItemQuality" NOT NULL,
    "damageMin" INTEGER,
    "damageMax" INTEGER,
    "armor" INTEGER,
    "traits" JSONB NOT NULL DEFAULT '[]',
    "upgrade" INTEGER NOT NULL DEFAULT 0,
    "rune" TEXT,
    "location" "ItemLocation" NOT NULL DEFAULT 'BACKPACK',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expeditions" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "locationKey" TEXT NOT NULL,
    "kind" "ExpeditionKind" NOT NULL,
    "tactic" "Tactic" NOT NULL DEFAULT 'BALANCED',
    "abilities" JSONB NOT NULL DEFAULT '[]',
    "potions" JSONB NOT NULL DEFAULT '[]',
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3) NOT NULL,
    "settled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "expeditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battle_reports" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "opponentKey" TEXT NOT NULL,
    "seed" BIGINT NOT NULL,
    "result" "BattleResult" NOT NULL,
    "turns" JSONB NOT NULL,
    "loot" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "battle_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boss_attempts" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "bossKey" TEXT NOT NULL,
    "day" DATE NOT NULL,

    CONSTRAINT "boss_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests_progress" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "questKey" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quests_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_titles" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "titleKey" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "character_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_actions" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_events" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "type" "ItemEventType" NOT NULL,
    "fromState" JSONB,
    "toState" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gold_events" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gold_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "characterId" TEXT,
    "type" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "characters_name_key" ON "characters"("name");

-- CreateIndex
CREATE INDEX "characters_userId_idx" ON "characters"("userId");

-- CreateIndex
CREATE INDEX "name_history_characterId_idx" ON "name_history"("characterId");

-- CreateIndex
CREATE INDEX "items_characterId_idx" ON "items"("characterId");

-- CreateIndex
CREATE INDEX "expeditions_characterId_idx" ON "expeditions"("characterId");

-- CreateIndex
CREATE INDEX "battle_reports_characterId_idx" ON "battle_reports"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "boss_attempts_characterId_bossKey_day_key" ON "boss_attempts"("characterId", "bossKey", "day");

-- CreateIndex
CREATE UNIQUE INDEX "quests_progress_characterId_questKey_key" ON "quests_progress"("characterId", "questKey");

-- CreateIndex
CREATE UNIQUE INDEX "character_titles_characterId_titleKey_key" ON "character_titles"("characterId", "titleKey");

-- CreateIndex
CREATE INDEX "admin_actions_adminId_idx" ON "admin_actions"("adminId");

-- CreateIndex
CREATE INDEX "item_events_characterId_idx" ON "item_events"("characterId");

-- CreateIndex
CREATE INDEX "item_events_itemId_idx" ON "item_events"("itemId");

-- CreateIndex
CREATE INDEX "gold_events_characterId_idx" ON "gold_events"("characterId");

-- CreateIndex
CREATE INDEX "game_events_userId_idx" ON "game_events"("userId");

-- CreateIndex
CREATE INDEX "game_events_characterId_idx" ON "game_events"("characterId");

-- CreateIndex
CREATE INDEX "game_events_type_idx" ON "game_events"("type");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "name_history" ADD CONSTRAINT "name_history_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expeditions" ADD CONSTRAINT "expeditions_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_reports" ADD CONSTRAINT "battle_reports_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boss_attempts" ADD CONSTRAINT "boss_attempts_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quests_progress" ADD CONSTRAINT "quests_progress_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_titles" ADD CONSTRAINT "character_titles_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_events" ADD CONSTRAINT "item_events_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gold_events" ADD CONSTRAINT "gold_events_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_events" ADD CONSTRAINT "game_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_events" ADD CONSTRAINT "game_events_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
