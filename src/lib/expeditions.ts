import "server-only";

import { cache } from "react";

import { buildHeroConfigFromEquipment } from "@/game/character/combatLoadout";
import type { EquippedItemSummary } from "@/game/character/combatLoadout";
import { validateAbilitySelection } from "@/game/character/abilitySelection";
import { applyExperience } from "@/game/character/experience";
import { MAX_STAMINA, regenerateStamina } from "@/game/character/stamina";
import type { Element, ExpeditionKind, Tactic } from "@/game/combat/types";
import { generateReport } from "@/game/combat/generateReport";
import type { ReportLine } from "@/game/combat/report";
import { EXPEDITION_KINDS } from "@/game/data/expeditionKinds";
import { AFFIXES } from "@/game/data/itemAffixes";
import { getLocation, LOCATIONS } from "@/game/data/locations";
import { MAX_BELT_POTIONS, getPotion } from "@/game/data/potions";
import { getMonster } from "@/game/data/monsters";
import { resolveExpedition } from "@/game/expeditions/resolveExpedition";
import type { ItemAffixInstance } from "@/game/items/types";
import { progressDailyQuests } from "@/lib/dailyQuests";
import { checkDeityQuests, recordExpeditionDeitySignals } from "@/lib/deityQuests";
import { progressLocationHunts } from "@/lib/hunts";
import { logServerError } from "@/lib/monitoring";
import { isLocationUnlocked, progressLocationQuests } from "@/lib/quests";

import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";

export const SERVER = "Valmor";

/**
 * Historia tej stałej (do przeglądu, ale rozwiązane):
 * 1) 5000ms (domyślne) → P2028 pod obciążeniem.
 * 2) Podniesione do 15000ms → requesty zaczęły wisieć do 300s (twardy limit
 *    Vercela) zamiast szybko zawieść – prawdziwa przyczyna NIE była w tej
 *    liczbie, tylko w puli połączeń Prisma/Neon (src/lib/prisma.ts) bez
 *    connectionTimeoutMillis: żądanie o połączenie z wyczerpanej puli
 *    czekało bez żadnego limitu czasu.
 * 3) connectionTimeoutMillis: 10000 dodane w src/lib/prisma.ts – pula już
 *    nie wisi w nieskończoność, więc wysoki timeout transakcji jest znowu
 *    bezpieczny. Dodatkowo settleExpedition wynosi symulację walki i
 *    budowę raportów poza transakcję (tylko zapisy do bazy zostają w
 *    środku) i checkDeityQuests czyta/zapisuje zbiorczo zamiast w pętli
 *    (src/lib/deityQuests.ts) – realne skrócenie liczby zapytań.
 */
const TRANSACTION_OPTIONS: { timeout: number } = { timeout: 20_000 };

async function loadEquippedItems(
  tx: Prisma.TransactionClient,
  characterId: string,
): Promise<EquippedItemSummary[]> {
  const items = await tx.item.findMany({ where: { characterId, location: "EQUIPPED" } });
  return items.map((item) => ({
    slot: item.slot,
    damageMin: item.damageMin,
    damageMax: item.damageMax,
    armor: item.armor,
    traits: (item.traits as unknown as ItemAffixInstance[]) ?? [],
    upgrade: item.upgrade,
    rune: item.rune,
    templateKey: item.templateKey,
  }));
}

/**
 * cache() = jedno wykonanie na żądanie (React request memoization). Layout gry
 * i strona pod nim obie wołają tę funkcję z tym samym userId – bez cache()
 * to osobne zapytanie do bazy przy KAŻDYM wejściu w podstronę, podwójnie
 * (zob. historia błędów "timeout exceeded when trying to connect" na / , /character,
 * /mapa, /bostwo, /inventory, /twierdza – wyczerpywanie puli połączeń Neon).
 */
export const getCharacterForUser = cache(async (userId: string) => {
  return prisma.character.findUnique({ where: { userId_server: { userId, server: SERVER } } });
});

/** Odświeża wytrwałość i rozlicza zakończoną wyprawę, jeśli jedna czeka. cache() – patrz getCharacterForUser. */
export const syncCharacter = cache(async (characterId: string) => {
  let character = await prisma.character.findUniqueOrThrow({ where: { id: characterId } });

  const now = new Date();
  const regen = regenerateStamina({ stamina: character.stamina, staminaUpdatedAt: character.staminaUpdatedAt }, now);
  const staminaChanged =
    regen.stamina !== character.stamina || regen.staminaUpdatedAt.getTime() !== character.staminaUpdatedAt.getTime();
  // lastActiveAt tylko raz dziennie, żeby nie zapisywać do bazy przy każdym wejściu.
  const activeStale = now.getTime() - character.lastActiveAt.getTime() > 60 * 60 * 1000;

  // Niezależne od siebie – zapis staminy/lastActiveAt i sprawdzenie zaległej wyprawy
  // nie czytają wzajemnych wyników, więc idą równolegle (jedna sekwencja zamiast dwóch).
  const [updated, dueExpedition] = await Promise.all([
    staminaChanged || activeStale
      ? prisma.character.update({
          where: { id: characterId },
          data: {
            stamina: regen.stamina,
            staminaUpdatedAt: regen.staminaUpdatedAt,
            ...(activeStale ? { lastActiveAt: now } : {}),
          },
        })
      : Promise.resolve(null),
    prisma.expedition.findFirst({
      where: { characterId, settled: false, endAt: { lte: now } },
    }),
  ]);
  if (updated) character = updated;

  let settlementReportLines: ReportLine[][] | null = null;
  if (dueExpedition) {
    settlementReportLines = await settleExpedition(dueExpedition.id);
    character = await prisma.character.findUniqueOrThrow({ where: { id: characterId } });
  }

  return { character, settlementReportLines };
});

export interface StartExpeditionError {
  error: string;
}

export async function startExpedition(
  characterId: string,
  locationKey: string,
  kind: ExpeditionKind,
  tactic: Tactic,
  selectedAbilities: string[] = [],
  spellElement: Element | null = null,
  selectedPotions: string[] = [],
): Promise<StartExpeditionError | { expeditionId: string; endAt: Date }> {
  const character = await prisma.character.findUniqueOrThrow({ where: { id: characterId } });
  const now = new Date();

  if (character.injuredUntil && character.injuredUntil > now) {
    return { error: "Jesteś ranny i nie możesz ruszyć na wyprawę." };
  }

  const abilityValidation = validateAbilitySelection(character.class, character.level, selectedAbilities);
  if (!abilityValidation.ok) {
    return { error: abilityValidation.error };
  }

  const uniquePotions = Array.from(new Set(selectedPotions));
  if (uniquePotions.length > MAX_BELT_POTIONS) {
    return { error: `Możesz zabrać maksymalnie ${MAX_BELT_POTIONS} mikstury.` };
  }
  for (const key of uniquePotions) {
    const potion = getPotion(key);
    if (!potion || potion.kind !== "COMBAT") {
      return { error: `Mikstury "${key}" nie można zabrać na wyprawę.` };
    }
    const owned = await prisma.consumable.findUnique({ where: { characterId_kind: { characterId, kind: key } } });
    if (!owned || owned.quantity <= 0) {
      return { error: `Nie masz mikstury: ${potion.name}.` };
    }
  }

  const activeExpedition = await prisma.expedition.findFirst({
    where: { characterId, settled: false },
  });
  if (activeExpedition) {
    return { error: "Jesteś już na wyprawie." };
  }

  const location = LOCATIONS.find((l) => l.key === locationKey);
  if (!location) {
    return { error: "Nieznana lokacja." };
  }
  if (character.level < location.minLevel) {
    return { error: `Ta lokacja wymaga poziomu ${location.minLevel}.` };
  }
  if (!(await isLocationUnlocked(prisma, characterId, locationKey))) {
    return { error: "Najpierw ukończ zadanie fabularne poprzedniej lokacji." };
  }

  const isBoss = kind === "BOSS";
  if (isBoss) {
    if (!location.bossKey) {
      return { error: "Ta lokacja nie ma bossa." };
    }
    const boss = getMonster(location.bossKey);
    if (character.level < boss.level) {
      return { error: `Boss wymaga poziomu ${boss.level}.` };
    }
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const existingAttempt = await prisma.bossAttempt.findUnique({
      where: { characterId_bossKey_day: { characterId, bossKey: location.bossKey, day: today } },
    });
    if (existingAttempt) {
      return { error: "Już dziś walczyłeś z tym bossem. Wróć jutro." };
    }
  }

  const kindDef = EXPEDITION_KINDS[kind];
  const stamina = Math.round(location.stamina * kindDef.timeMultiplier);
  const regen = regenerateStamina({ stamina: character.stamina, staminaUpdatedAt: character.staminaUpdatedAt }, now);
  if (regen.stamina < stamina) {
    return { error: `Potrzebujesz ${stamina} wytrwałości, masz ${regen.stamina}.` };
  }

  const equippedItemsAtStart = await loadEquippedItems(prisma, characterId);
  const timeReductionPercent = Math.min(
    AFFIXES.expeditionTimeReductionPercent.cap ?? Infinity,
    equippedItemsAtStart.reduce(
      (sum, item) => sum + item.traits.filter((t) => t.key === "expeditionTimeReductionPercent").reduce((s, t) => s + t.value, 0),
      0,
    ),
  );
  const durationMs = Math.round(location.timeMinutes * kindDef.timeMultiplier * 60 * 1000 * (1 - timeReductionPercent / 100));
  const endAt = new Date(now.getTime() + durationMs);
  const seed = BigInt(Math.floor(Math.random() * 0xffffffff) + 1);

  const expedition = await prisma.$transaction(async (tx) => {
    if (isBoss && location.bossKey) {
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      await tx.bossAttempt.create({ data: { characterId, bossKey: location.bossKey, day: today } });
    }

    await tx.character.update({
      where: { id: characterId },
      data: { stamina: regen.stamina - stamina, staminaUpdatedAt: regen.staminaUpdatedAt },
    });

    const created = await tx.expedition.create({
      data: {
        characterId,
        locationKey,
        kind,
        tactic,
        seed,
        startAt: now,
        endAt,
        abilities: abilityValidation.selected,
        spellElement: character.class === "MAGE" ? spellElement ?? "fire" : null,
        potions: uniquePotions,
      },
    });

    await tx.gameEvent.create({
      data: {
        characterId,
        type: "wyprawa: start",
        details: { location: locationKey, kind, tactic, abilities: abilityValidation.selected, potions: uniquePotions },
      },
    });

    return created;
  });

  return { expeditionId: expedition.id, endAt: expedition.endAt };
}

/**
 * Rozlicza wyprawę i zwraca linie raportu każdej walki (do wyświetlenia).
 *
 * Odczyty i obliczenia (symulacja walki, raporty, heroConfig) celowo dzieją
 * się POZA transakcją – liczy się do budżetu Prisma interactive transaction
 * (TRANSACTION_OPTIONS) tak samo jak czas sieci, więc ciężkie obliczenia w
 * środku transakcji zabierały czas, który powinien iść na same zapisy.
 * Transakcja zostaje tylko do zapisów, z ponownym sprawdzeniem `settled` na
 * wejściu (ochrona przed podwójnym rozliczeniem przy równoległych żądaniach).
 */
async function settleExpedition(expeditionId: string): Promise<ReportLine[][]> {
  // Zajęcie wyprawy osobnym, natychmiast zatwierdzanym zapisem (nie w $transaction) –
  // przy nawigacji po kilku zakładkach/kliknięciach naraz dwa równoległe wywołania mogły
  // obie przejść sprawdzenie "settled" przed zapisem i wejść w pełną transakcję rozliczenia;
  // druga czekała na blokadę wiersza postaci przez CAŁY czas pierwszej transakcji, co dawało
  // P2028 "expired transaction" (zob. log: 44s przy limicie 20s). Ten zapis trwa milisekundy,
  // więc przegrany wyścigu wychodzi od razu, zamiast kolejkować się za całą pracą zwycięzcy.
  const claimed = await prisma.expedition.updateMany({
    where: { id: expeditionId, settled: false },
    data: { settled: true },
  });
  if (claimed.count === 0) return [];

  const expedition = await prisma.expedition.findUniqueOrThrow({ where: { id: expeditionId } });
  const character = await prisma.character.findUniqueOrThrow({ where: { id: expedition.characterId } });
  const location = getLocation(expedition.locationKey);
  const equippedItems = await loadEquippedItems(prisma, character.id);
  const selectedAbilities = (expedition.abilities as unknown as string[]) ?? [];
  const selectedPotions = (expedition.potions as unknown as string[]) ?? [];
  const spellElement = expedition.spellElement as Element | null;

  const resolution = resolveExpedition({
    classKey: character.class,
    level: character.level,
    stats: {
      strength: character.strength,
      dexterity: character.dexterity,
      vitality: character.vitality,
      intellect: character.intellect,
    },
    tactic: expedition.tactic,
    location,
    kind: expedition.kind,
    seed: Number(expedition.seed),
    startingGoldPouch: character.goldPouch,
    fightsSinceRareDrop: character.fightsSinceRareDrop,
    deity: character.deity,
    deityGrace: character.deityGrace,
    equippedItems,
    selectedAbilities,
    selectedPotions,
    spellElement: spellElement ?? undefined,
  });

  const afterBattleLevel = applyExperience(character.level, character.experience, character.race, resolution.totalXp);
  const goldAfterBattle = Math.max(0, character.goldPouch + resolution.totalGoldDelta);
  const newInjuredUntil =
    resolution.injuredMinutes > 0 ? new Date(Date.now() + resolution.injuredMinutes * 60 * 1000) : character.injuredUntil;

  const winCount = resolution.fights.filter((f) => f.battle.result === "WIN").length;

  // heroConfig i raporty walk to czysta funkcja tekstu/stylu (src/game/combat) – zero zapytań do bazy, liczymy poza transakcją.
  const heroConfigForReport = buildHeroConfigFromEquipment({
    classKey: character.class,
    level: character.level,
    stats: {
      strength: character.strength,
      dexterity: character.dexterity,
      vitality: character.vitality,
      intellect: character.intellect,
    },
    tactic: expedition.tactic,
    spellElement: spellElement ?? undefined,
    equippedItems,
    selectedAbilities,
    deity: character.deity,
    deityGrace: character.deityGrace,
    selectedPotions,
  });

  const fightReports = resolution.fights.map((fight) => {
    const monsterDef = getMonster(fight.monsterKey);
    const lines = generateReport(
      fight.battle,
      {
        heroName: character.name,
        monster: {
          key: monsterDef.key,
          name: monsterDef.name,
          level: monsterDef.level,
          type: monsterDef.type,
          isBoss: monsterDef.isBoss,
          weakTo: monsterDef.weakTo,
          resistTo: monsterDef.resistTo,
        },
        hero: heroConfigForReport,
        experience: fight.xpGained,
        gold: Math.max(0, fight.goldDelta),
        lootItemName: fight.lootItem?.name,
      },
      fight.seedUsed,
    );
    return { fight, lines };
  });

  try {
    return await settleExpeditionTransaction();
  } catch (error) {
    await logServerError("settleExpedition", error, { expeditionId, characterId: character.id });
    throw error;
  }

  function settleExpeditionTransaction(): Promise<ReportLine[][]> {
    return prisma.$transaction(async (tx) => {
    // Cztery niezależne od siebie funkcje (żadna nie czyta wyniku innej) – odpalone razem
    // zamiast po kolei, żeby nie sumować ich czasu round-tripu do Neon.
    const [, questRewards, huntRewards, dailyReward] = await Promise.all([
      recordExpeditionDeitySignals(tx, character.id, resolution, expedition.kind),
      progressLocationQuests(tx, {
        characterId: character.id,
        characterLevel: afterBattleLevel.level,
        characterClass: character.class,
        locationKey: location.key,
        expeditionKind: expedition.kind,
        winCount,
        bossKey: expedition.kind === "BOSS" ? (location.bossKey ?? null) : null,
        bossResult: expedition.kind === "BOSS" ? resolution.overallResult : null,
      }),
      progressLocationHunts(tx, {
        characterId: character.id,
        characterLevel: afterBattleLevel.level,
        locationKey: location.key,
        winCount,
        now: new Date(),
      }),
      progressDailyQuests(tx, {
        characterId: character.id,
        characterLevel: afterBattleLevel.level,
        characterClass: character.class,
        now: new Date(),
        delta: {
          expeditions: 1,
          wins: winCount,
          bossWin: expedition.kind === "BOSS" && resolution.overallResult === "WIN",
          goldEarned: resolution.totalGoldDelta,
          lootFound: resolution.fights.some((f) => f.lootItem !== null),
        },
      }),
    ]);

    const questXp = questRewards.reduce((sum, r) => sum + r.xpBonus, 0) + huntRewards.reduce((sum, r) => sum + r.xpBonus, 0);
    const questGold =
      questRewards.reduce((sum, r) => sum + r.goldBonus, 0) + huntRewards.reduce((sum, r) => sum + r.goldBonus, 0);
    const questStamina =
      questRewards.reduce((sum, r) => sum + r.staminaBonus, 0) + (dailyReward?.staminaBonus ?? 0);

    const leveled =
      questXp > 0
        ? applyExperience(afterBattleLevel.level, afterBattleLevel.experience, character.race, questXp)
        : afterBattleLevel;
    const newGoldPouch = goldAfterBattle + questGold;
    const freePointsGained = afterBattleLevel.freePointsGained + (questXp > 0 ? leveled.freePointsGained : 0);

    // Niezależne zapisy (żaden nie czyta wyniku innego – wszystkie liczby już policzone
    // wyżej) odpalone razem zamiast po kolei.
    const postBattleWrites: Promise<unknown>[] = [
      tx.character.update({
        where: { id: character.id },
        data: {
          level: leveled.level,
          experience: leveled.experience,
          freePoints: character.freePoints + freePointsGained,
          goldPouch: newGoldPouch,
          stamina: Math.min(MAX_STAMINA, character.stamina + questStamina),
          injuredUntil: newInjuredUntil,
          fightsSinceRareDrop: resolution.fightsSinceRareDropAfter,
        },
      }),
    ];

    if (questGold !== 0) {
      postBattleWrites.push(
        tx.goldEvent.create({
          data: {
            characterId: character.id,
            amount: questGold,
            balanceAfter: newGoldPouch,
            reason: "zadanie ukończone",
          },
        }),
      );
    }

    for (const potionKey of resolution.potionsConsumed) {
      postBattleWrites.push(
        tx.consumable.updateMany({
          where: { characterId: character.id, kind: potionKey, quantity: { gt: 0 } },
          data: { quantity: { decrement: 1 } },
        }),
      );
    }

    if (resolution.totalGoldDelta !== 0) {
      postBattleWrites.push(
        tx.goldEvent.create({
          data: {
            characterId: character.id,
            amount: resolution.totalGoldDelta,
            balanceAfter: newGoldPouch,
            reason: `wyprawa: ${location.name}`,
          },
        }),
      );
    }

    if (leveled.level > character.level) {
      postBattleWrites.push(
        tx.gameEvent.create({
          data: { characterId: character.id, type: "awans", details: { level: leveled.level } },
        }),
      );
    }

    await Promise.all(postBattleWrites);

    const allLines: ReportLine[][] = [];
    // Raporty i łupy każdej walki nie zależą od siebie nawzajem – zapisy odpalone razem.
    const fightWrites: Promise<unknown>[] = [];

    for (const { fight, lines } of fightReports) {
      allLines.push(lines);

      const lootSummary: Array<{ name: string; slot: string; quality: string }> = fight.lootItem
        ? [{ name: fight.lootItem.name, slot: fight.lootItem.slot, quality: fight.lootItem.quality }]
        : [];

      if (fight.lootItem) {
        const lootItem = fight.lootItem;
        fightWrites.push(
          tx.item
            .create({
              data: {
                characterId: character.id,
                name: lootItem.name,
                slot: lootItem.slot,
                level: lootItem.level,
                quality: lootItem.quality,
                forClass: lootItem.forClass,
                damageMin: lootItem.damageMin,
                damageMax: lootItem.damageMax,
                armor: lootItem.armor,
                traits: JSON.parse(JSON.stringify(lootItem.affixes)),
              },
            })
            .then((item) =>
              tx.itemEvent.create({
                data: {
                  itemId: item.id,
                  characterId: character.id,
                  type: "CREATED",
                  toState: { name: lootItem.name, slot: item.slot, quality: item.quality },
                  reason: `łup: ${location.name}`,
                },
              }),
            ),
        );
      }

      fightWrites.push(
        tx.battleReport.create({
          data: {
            characterId: character.id,
            expeditionId: expedition.id,
            opponentKey: fight.monsterKey,
            seed: BigInt(fight.seedUsed),
            result: fight.battle.result,
            turns: JSON.parse(JSON.stringify(lines)),
            loot: lootSummary,
          },
        }),
      );
    }

    await Promise.all(fightWrites);

    if (questRewards.length > 0) {
      const questLines = questRewards.map((r) => {
        const extras = [
          r.lootItemName ? `przedmiot: ${r.lootItemName}` : null,
          r.chapterRewardTitle ? `tytuł: ${r.chapterRewardTitle}` : null,
        ].filter(Boolean);
        return (
          `Zadanie ukończone: ${r.title}. Zdobywasz ${r.xpBonus} PD i ${r.goldBonus} złota` +
          (extras.length ? ` (${extras.join(", ")}).` : ".")
        );
      });
      allLines.push(questLines.map((text) => ({ text })));
    }

    if (huntRewards.length > 0) {
      const huntLines = huntRewards.map((r) => {
        const potionName = getPotion(r.potionKey)?.name ?? r.potionKey;
        return `Łowy ukończone! Zdobywasz ${r.xpBonus} PD, ${r.goldBonus} złota i miksturę: ${potionName}.`;
      });
      allLines.push(huntLines.map((text) => ({ text })));
    }

    if (dailyReward) {
      const parts = [
        `Zadania dzienne: komplet! +${dailyReward.staminaBonus} wytrwałości`,
        dailyReward.itemName ? `przedmiot: ${dailyReward.itemName}` : null,
      ].filter(Boolean);
      const lines = [parts.join(", ") + "."];
      if (dailyReward.streakDay && dailyReward.streakDay % 7 === 0) {
        lines.push(
          `Seria ${dailyReward.streakDay} dni z rzędu! Skrzynia legendarna` +
            (dailyReward.legendaryBonusItemName ? `: ${dailyReward.legendaryBonusItemName}.` : "."),
        );
      }
      allLines.push(lines.map((text) => ({ text })));
    }

    const deityCompletions = await checkDeityQuests(tx, character.id, leveled.level, character.deity, {
      strength: character.strength,
      dexterity: character.dexterity,
      vitality: character.vitality,
      intellect: character.intellect,
    });
    if (deityCompletions.length > 0) {
      allLines.push(deityCompletions.map((c) => ({ text: `Zadanie bóstwa ukończone: ${c.title} Zdobywasz łaskę.` })));
    }

      return allLines;
    }, TRANSACTION_OPTIONS);
  }
}

export { MAX_STAMINA };
