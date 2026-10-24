import { buildHeroConfigFromEquipment } from "@/game/character/combatLoadout";
import type { EquippedItemSummary } from "@/game/character/combatLoadout";
import { createRng, randomInt } from "@/game/combat/rng";
import { simulateBattle } from "@/game/combat/simulate";
import type { BattleOutcome, BattleResult, ClassKey, Element, ExpeditionKind, MonsterConfig, Stats, Tactic } from "@/game/combat/types";
import { EXPEDITION_KINDS } from "@/game/data/expeditionKinds";
import { AFFIXES } from "@/game/data/itemAffixes";
import type { LocationDefinition } from "@/game/data/locations";
import { getMonster } from "@/game/data/monsters";
import { generateLoot } from "@/game/items/generateItem";
import type { GeneratedItem, ItemQuality } from "@/game/items/types";

/** Suma procentowej cechy ekwipunku (np. +% złota z wypraw), z limitem cross-item z docs/gdd/08-ekwipunek.md. */
function sumGearPercent(items: EquippedItemSummary[], key: "goldFromExpeditionsPercent" | "experiencePercent"): number {
  const total = items.reduce(
    (sum, item) => sum + item.traits.filter((t) => t.key === key).reduce((s, t) => s + t.value, 0),
    0,
  );
  const cap = AFFIXES[key].cap;
  return cap != null ? Math.min(total, cap) : total;
}

export interface FightOutcome {
  monsterKey: string;
  monsterName: string;
  isBoss: boolean;
  battle: BattleOutcome;
  seedUsed: number;
  xpGained: number;
  goldDelta: number;
  lootItem: GeneratedItem | null;
}

export interface ExpeditionResolution {
  fights: FightOutcome[];
  overallResult: BattleResult;
  totalXp: number;
  totalGoldDelta: number;
  /** Minuty rany (0 = brak); 30 jeśli przegrana walka była z bossem, inaczej 15. */
  injuredMinutes: number;
  fightsSinceRareDropAfter: number;
  /** Klucze mikstur bojowych zużytych w którejkolwiek walce tej wyprawy (do odliczenia z zapasów). */
  potionsConsumed: string[];
}

export interface ResolveExpeditionParams {
  classKey: ClassKey;
  level: number;
  stats: Stats;
  tactic: Tactic;
  location: LocationDefinition;
  kind: ExpeditionKind;
  seed: number;
  startingGoldPouch: number;
  fightsSinceRareDrop: number;
  equippedItems: EquippedItemSummary[];
  selectedAbilities?: string[];
  selectedPotions?: string[];
  spellElement?: Element;
}

function toMonsterConfig(key: string): MonsterConfig {
  const def = getMonster(key);
  return { key: def.key, name: def.name, level: def.level, type: def.type, isBoss: def.isBoss, weakTo: def.weakTo, resistTo: def.resistTo };
}

/**
 * Rozlicza wyprawę (1 walka dla Zwiadu/Polowania/Bossa, 2–3 pod rząd dla
 * Głębokiej wyprawy, bez leczenia między nimi – docs/gdd/05-lokacje.md).
 * Czysta funkcja: żadnego zapisu do bazy, wszystko wraca w wyniku.
 */
export function resolveExpedition(params: ResolveExpeditionParams): ExpeditionResolution {
  const rng = createRng(params.seed);
  const kindDef = EXPEDITION_KINDS[params.kind];
  const isBossRun = params.kind === "BOSS";

  const fightCount = isBossRun ? 1 : randomInt(rng, kindDef.fights[0], kindDef.fights[1]);

  const heroConfig = buildHeroConfigFromEquipment({
    classKey: params.classKey,
    level: params.level,
    stats: params.stats,
    tactic: params.tactic,
    spellElement: params.spellElement,
    equippedItems: params.equippedItems,
    selectedAbilities: params.selectedAbilities,
    selectedPotions: params.selectedPotions,
  });

  const goldBonusPercent = sumGearPercent(params.equippedItems, "goldFromExpeditionsPercent");
  const xpBonusPercent = sumGearPercent(params.equippedItems, "experiencePercent");

  const fights: FightOutcome[] = [];
  let runningGold = params.startingGoldPouch;
  let pity = params.fightsSinceRareDrop;
  let previousHeroHpEnd: number | undefined;

  for (let i = 0; i < fightCount; i++) {
    const monsterKey = isBossRun
      ? params.location.bossKey!
      : params.location.monsterKeys[Math.floor(rng() * params.location.monsterKeys.length)];
    const monster = toMonsterConfig(monsterKey);

    const seedUsed = Math.floor(rng() * 0xffffffff);
    const battle = simulateBattle(
      {
        ...heroConfig,
        startingHpOverride: kindDef.healBetweenFights ? undefined : previousHeroHpEnd,
      },
      monster,
      seedUsed,
    );
    previousHeroHpEnd = battle.heroHpEnd;

    const fullXp = 25 * monster.level * (monster.isBoss ? 5 : 1);
    let xpGained = 0;
    let goldDelta = 0;
    let lootItem: GeneratedItem | null = null;

    if (battle.result === "WIN") {
      xpGained = Math.round(fullXp * (1 + xpBonusPercent / 100));
      goldDelta = Math.round(3 * monster.level * (0.8 + rng() * 0.4) * kindDef.goldMultiplier * (1 + goldBonusPercent / 100));
      runningGold += goldDelta;

      const lootChance = isBossRun ? 1 : kindDef.lootChance;
      if (rng() < lootChance) {
        const guaranteedMinQuality: ItemQuality | undefined = isBossRun ? "RARE" : pity >= 20 ? "RARE" : undefined;
        lootItem = generateLoot({
          rng,
          monsterLevel: monster.level,
          playerClass: params.classKey,
          kind: kindDef,
          guaranteedMinQuality,
          forceItem: isBossRun,
        });
        if (lootItem && (lootItem.quality === "RARE" || lootItem.quality === "LEGENDARY")) {
          pity = 0;
        } else {
          pity += 1;
        }
      } else {
        pity += 1;
      }
    } else if (battle.result === "LOSE") {
      xpGained = Math.round(fullXp * 0.3 * (1 + xpBonusPercent / 100));
      const penalty = Math.round(runningGold * 0.05);
      goldDelta = -penalty;
      runningGold -= penalty;
    } else {
      // DRAW lub RETREAT
      xpGained = Math.round(fullXp * 0.5 * (1 + xpBonusPercent / 100));
    }

    fights.push({
      monsterKey,
      monsterName: monster.name,
      isBoss: monster.isBoss,
      battle,
      seedUsed,
      xpGained,
      goldDelta,
      lootItem,
    });

    if (battle.result !== "WIN") break;
  }

  const lastFight = fights[fights.length - 1];
  const totalXp = fights.reduce((sum, f) => sum + f.xpGained, 0);
  const totalGoldDelta = fights.reduce((sum, f) => sum + f.goldDelta, 0);
  const injuredMinutes = lastFight.battle.result === "LOSE" ? (lastFight.isBoss ? 30 : 15) : 0;
  const potionsConsumed = Array.from(new Set(fights.flatMap((f) => f.battle.potionsConsumed)));

  return {
    fights,
    overallResult: lastFight.battle.result,
    totalXp,
    totalGoldDelta,
    injuredMinutes,
    fightsSinceRareDropAfter: pity,
    potionsConsumed,
  };
}
