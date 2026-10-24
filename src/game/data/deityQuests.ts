import type { DeityKey } from "./deities";

/**
 * Zadania bóstw (docs/gdd/11-gospodarka-i-zadania.md): każde bóstwo ma 10
 * zadań odblokowywanych co 10 poziomów bohatera (10..100), wymaga Świątyni
 * poziomu 1. GDD podaje tylko 1 przykładowe zadanie na bóstwo (oznaczone
 * niżej); pozostałe 9 na bóstwo (63 łącznie) są naszą własną treścią w duchu
 * domeny bóstwa – do przeglądu/zmiany przez Patryka.
 */

export type DeityQuestCondition =
  | { type: "WIN_TYPE"; monsterTypes: string[]; target: number }
  | { type: "WIN_NO_POTION_TYPE"; monsterTypes: string[]; target: number }
  | { type: "WIN_NO_POTION_ANY"; target: number }
  | { type: "DEEP_WIN_NO_POTION"; target: number }
  | { type: "BOSS_DEFEAT_NO_POTION"; target: number }
  | { type: "SCOUT_WIN"; target: number }
  | { type: "LOSE_COUNT"; target: number }
  | { type: "NARROW_WIN"; target: number }
  | { type: "CRIT_COUNT"; target: number }
  | { type: "CRIT_COUNT_BOSS"; target: number }
  | { type: "DODGE_COUNT"; target: number }
  | { type: "BOSS_COMEBACK"; target: number }
  | { type: "PVP_WIN_TACTIC"; tactic: "AGGRESSIVE" | null; target: number }
  | { type: "UPGRADE_SUCCESS"; target: number }
  | { type: "UPGRADE_REACHED"; target: number }
  | { type: "UNITS_TRAINED"; target: number }
  | { type: "RAID_WIN"; target: number }
  | { type: "RAID_LOOT"; target: number }
  | { type: "SIEGE_WIN"; target: number }
  | { type: "MARKET_SOLD_GOLD"; target: number }
  | { type: "EXPEDITION_GOLD"; target: number }
  | { type: "VAULT_GOLD_REACHED"; target: number }
  | { type: "ITEM_AFFIX_COUNT"; affixKey: string; target: number }
  | { type: "ITEM_QUALITY_COUNT"; quality: string; target: number }
  | { type: "STAT_REACHED"; stat: "strength" | "dexterity" | "vitality" | "intellect"; target: number }
  | { type: "SET_COMPLETE"; target: number }
  | { type: "INJURY_HEALED"; target: number };

export interface DeityQuestDefinition {
  key: string;
  deity: DeityKey;
  level: number;
  title: string;
  condition: DeityQuestCondition;
  example?: boolean;
}

function q(deity: DeityKey, level: number, title: string, condition: DeityQuestCondition, example = false): DeityQuestDefinition {
  return { key: `bostwo:${deity.toLowerCase()}:${level}`, deity, level, title, condition, example };
}

export const DEITY_QUEST_LEVELS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export const DEITY_QUESTS: DeityQuestDefinition[] = [
  // Solaris — światło, uzdrawianie, nieumarli
  q("SOLARIS", 10, "Pokonaj 20 nieumarłych bez użycia mikstur życia.", { type: "WIN_NO_POTION_TYPE", monsterTypes: ["undead"], target: 20 }, true),
  q("SOLARIS", 20, "Pokonaj 40 nieumarłych.", { type: "WIN_TYPE", monsterTypes: ["undead"], target: 40 }),
  q("SOLARIS", 30, "Wygraj 15 walk bez użycia żadnej mikstury.", { type: "WIN_NO_POTION_ANY", target: 15 }),
  q("SOLARIS", 40, "Pokonaj 60 nieumarłych.", { type: "WIN_TYPE", monsterTypes: ["undead"], target: 60 }),
  q("SOLARIS", 50, "Wygraj 10 głębokich wypraw bez użycia mikstury.", { type: "DEEP_WIN_NO_POTION", target: 10 }),
  q("SOLARIS", 60, "Pokonaj 100 nieumarłych.", { type: "WIN_TYPE", monsterTypes: ["undead"], target: 100 }),
  q("SOLARIS", 70, "Wygraj 30 walk bez użycia żadnej mikstury.", { type: "WIN_NO_POTION_ANY", target: 30 }),
  q("SOLARIS", 80, "Pokonaj bossa bez użycia mikstury życia 5 razy.", { type: "BOSS_DEFEAT_NO_POTION", target: 5 }),
  q("SOLARIS", 90, "Pokonaj 150 nieumarłych.", { type: "WIN_TYPE", monsterTypes: ["undead"], target: 150 }),
  q("SOLARIS", 100, "Wygraj 50 walk bez użycia żadnej mikstury.", { type: "WIN_NO_POTION_ANY", target: 50 }),

  // Korgath — wojna, stal
  q("KORGATH", 10, "Wygraj 10 pojedynków PvP z taktyką Natarcie.", { type: "PVP_WIN_TACTIC", tactic: "AGGRESSIVE", target: 10 }, true),
  q("KORGATH", 20, "Ulepsz przedmiot 5 razy u kowala (sukces).", { type: "UPGRADE_SUCCESS", target: 5 }),
  q("KORGATH", 30, "Wygraj 20 pojedynków PvP z taktyką Natarcie.", { type: "PVP_WIN_TACTIC", tactic: "AGGRESSIVE", target: 20 }),
  q("KORGATH", 40, "Wyszkol 100 jednostek wojska.", { type: "UNITS_TRAINED", target: 100 }),
  q("KORGATH", 50, "Ulepsz przedmiot do poziomu +5.", { type: "UPGRADE_REACHED", target: 5 }),
  q("KORGATH", 60, "Wygraj 30 pojedynków PvP z taktyką Natarcie.", { type: "PVP_WIN_TACTIC", tactic: "AGGRESSIVE", target: 30 }),
  q("KORGATH", 70, "Wygraj 5 napadów na twierdze.", { type: "RAID_WIN", target: 5 }),
  q("KORGATH", 80, "Ulepsz przedmiot do poziomu +8.", { type: "UPGRADE_REACHED", target: 8 }),
  q("KORGATH", 90, "Zdobądź prowincję w oblężeniu.", { type: "SIEGE_WIN", target: 1 }),
  q("KORGATH", 100, "Wygraj 50 pojedynków PvP z taktyką Natarcie.", { type: "PVP_WIN_TACTIC", tactic: "AGGRESSIVE", target: 50 }),

  // Ilyra — magia, gwiazdy
  q("ILYRA", 10, "Zdobądź 3 przedmioty z cechą +INT.", { type: "ITEM_AFFIX_COUNT", affixKey: "intellect", target: 3 }, true),
  q("ILYRA", 20, "Osiągnij 50 Intelektu.", { type: "STAT_REACHED", stat: "intellect", target: 50 }),
  q("ILYRA", 30, "Zdobądź 6 przedmiotów z cechą +INT.", { type: "ITEM_AFFIX_COUNT", affixKey: "intellect", target: 6 }),
  q("ILYRA", 40, "Zdobądź legendarny przedmiot.", { type: "ITEM_QUALITY_COUNT", quality: "LEGENDARY", target: 1 }),
  q("ILYRA", 50, "Osiągnij 80 Intelektu.", { type: "STAT_REACHED", stat: "intellect", target: 80 }),
  q("ILYRA", 60, "Zdobądź 10 przedmiotów z cechą +INT.", { type: "ITEM_AFFIX_COUNT", affixKey: "intellect", target: 10 }),
  q("ILYRA", 70, "Zdobądź 2 legendarne przedmioty.", { type: "ITEM_QUALITY_COUNT", quality: "LEGENDARY", target: 2 }),
  q("ILYRA", 80, "Osiągnij 120 Intelektu.", { type: "STAT_REACHED", stat: "intellect", target: 120 }),
  q("ILYRA", 90, "Załóż pełny zestaw klasowy (5 części).", { type: "SET_COMPLETE", target: 1 }),
  q("ILYRA", 100, "Osiągnij 150 Intelektu.", { type: "STAT_REACHED", stat: "intellect", target: 150 }),

  // Veyl — cienie, podstęp
  q("VEYL", 10, "Zadaj 50 trafień krytycznych.", { type: "CRIT_COUNT", target: 50 }, true),
  q("VEYL", 20, "Zadaj 100 trafień krytycznych.", { type: "CRIT_COUNT", target: 100 }),
  q("VEYL", 30, "Unikaj ciosu 20 razy.", { type: "DODGE_COUNT", target: 20 }),
  q("VEYL", 40, "Zadaj 200 trafień krytycznych.", { type: "CRIT_COUNT", target: 200 }),
  q("VEYL", 50, "Zadaj krytyka bossowi 10 razy.", { type: "CRIT_COUNT_BOSS", target: 10 }),
  q("VEYL", 60, "Zadaj 350 trafień krytycznych.", { type: "CRIT_COUNT", target: 350 }),
  q("VEYL", 70, "Unikaj ciosu 50 razy.", { type: "DODGE_COUNT", target: 50 }),
  q("VEYL", 80, "Zadaj 500 trafień krytycznych.", { type: "CRIT_COUNT", target: 500 }),
  q("VEYL", 90, "Zadaj krytyka bossowi 25 razy.", { type: "CRIT_COUNT_BOSS", target: 25 }),
  q("VEYL", 100, "Zadaj 750 trafień krytycznych.", { type: "CRIT_COUNT", target: 750 }),

  // Mardun — handel, złoto
  q("MARDUN", 10, "Sprzedaj na targowisku przedmioty za 5 000 złota.", { type: "MARKET_SOLD_GOLD", target: 5000 }, true),
  q("MARDUN", 20, "Zarobij 10 000 złota z wypraw.", { type: "EXPEDITION_GOLD", target: 10000 }),
  q("MARDUN", 30, "Sprzedaj na targowisku przedmioty za 15 000 złota.", { type: "MARKET_SOLD_GOLD", target: 15000 }),
  q("MARDUN", 40, "Wygraj 10 pojedynków PvP.", { type: "PVP_WIN_TACTIC", tactic: null, target: 10 }),
  q("MARDUN", 50, "Zarobij 30 000 złota z wypraw.", { type: "EXPEDITION_GOLD", target: 30000 }),
  q("MARDUN", 60, "Sprzedaj na targowisku przedmioty za 40 000 złota.", { type: "MARKET_SOLD_GOLD", target: 40000 }),
  q("MARDUN", 70, "Zrabuj 20 000 surowców w napadach na twierdze.", { type: "RAID_LOOT", target: 20000 }),
  q("MARDUN", 80, "Zarobij 75 000 złota z wypraw.", { type: "EXPEDITION_GOLD", target: 75000 }),
  q("MARDUN", 90, "Sprzedaj na targowisku przedmioty za 100 000 złota.", { type: "MARKET_SOLD_GOLD", target: 100000 }),
  q("MARDUN", 100, "Zgromadź 200 000 złota w skarbcu twierdzy.", { type: "VAULT_GOLD_REACHED", target: 200000 }),

  // Thessa — natura, łowy
  q("THESSA", 10, "Pokonaj 30 zwierząt.", { type: "WIN_TYPE", monsterTypes: ["animal", "beast"], target: 30 }, true),
  q("THESSA", 20, "Pokonaj 60 zwierząt lub bestii.", { type: "WIN_TYPE", monsterTypes: ["animal", "beast"], target: 60 }),
  q("THESSA", 30, "Wygraj 20 zwiadów.", { type: "SCOUT_WIN", target: 20 }),
  q("THESSA", 40, "Pokonaj 100 zwierząt lub bestii.", { type: "WIN_TYPE", monsterTypes: ["animal", "beast"], target: 100 }),
  q("THESSA", 50, "Zdobądź 5 przedmiotów z cechą celności.", { type: "ITEM_AFFIX_COUNT", affixKey: "hitPercent", target: 5 }),
  q("THESSA", 60, "Pokonaj 150 zwierząt lub bestii.", { type: "WIN_TYPE", monsterTypes: ["animal", "beast"], target: 150 }),
  q("THESSA", 70, "Wygraj 40 zwiadów.", { type: "SCOUT_WIN", target: 40 }),
  q("THESSA", 80, "Pokonaj 220 zwierząt lub bestii.", { type: "WIN_TYPE", monsterTypes: ["animal", "beast"], target: 220 }),
  q("THESSA", 90, "Zdobądź 10 przedmiotów z cechą celności.", { type: "ITEM_AFFIX_COUNT", affixKey: "hitPercent", target: 10 }),
  q("THESSA", 100, "Pokonaj 300 zwierząt lub bestii.", { type: "WIN_TYPE", monsterTypes: ["animal", "beast"], target: 300 }),

  // Morrak — śmierć, przeznaczenie
  q("MORRAK", 10, "Przegraj walkę z bossem i wróć, by go pokonać w ciągu 3 dni.", { type: "BOSS_COMEBACK", target: 1 }, true),
  q("MORRAK", 20, "Przetrwaj 10 przegranych walk.", { type: "LOSE_COUNT", target: 10 }),
  q("MORRAK", 30, "Pokonaj bossa, z którym wcześniej przegrałeś, 3 razy.", { type: "BOSS_COMEBACK", target: 3 }),
  q("MORRAK", 40, "Przetrwaj 25 przegranych walk.", { type: "LOSE_COUNT", target: 25 }),
  q("MORRAK", 50, "Wylecz ranę 20 razy miksturą uzdrowienia.", { type: "INJURY_HEALED", target: 20 }),
  q("MORRAK", 60, "Pokonaj bossa, z którym wcześniej przegrałeś, 6 razy.", { type: "BOSS_COMEBACK", target: 6 }),
  q("MORRAK", 70, "Przetrwaj 50 przegranych walk.", { type: "LOSE_COUNT", target: 50 }),
  q("MORRAK", 80, "Wygraj walkę mając na koniec poniżej 10% PŻ.", { type: "NARROW_WIN", target: 1 }),
  q("MORRAK", 90, "Wygraj 5 walk mając na koniec poniżej 10% PŻ.", { type: "NARROW_WIN", target: 5 }),
  q("MORRAK", 100, "Pokonaj bossa, z którym wcześniej przegrałeś, 10 razy.", { type: "BOSS_COMEBACK", target: 10 }),
];

export function deityQuestsFor(deity: DeityKey): DeityQuestDefinition[] {
  return DEITY_QUESTS.filter((d) => d.deity === deity).sort((a, b) => a.level - b.level);
}

export function getDeityQuest(key: string): DeityQuestDefinition | undefined {
  return DEITY_QUESTS.find((d) => d.key === key);
}

/** Łask na stopień i maksymalny stopień (docs/gdd/11-gospodarka-i-zadania.md). */
export const GRACE_PER_TIER = 10;
export const MAX_DEITY_TIER = 5;
export const TIER_BONUS_PERCENT = 20;

export function tierForGrace(grace: number): number {
  return Math.min(MAX_DEITY_TIER, Math.floor(grace / GRACE_PER_TIER));
}

/** Mnożnik bonusu bóstwa: 1 + 20% × stopień. */
export function tierMultiplier(grace: number): number {
  return 1 + (TIER_BONUS_PERCENT / 100) * tierForGrace(grace);
}
