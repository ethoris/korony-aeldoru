import { CLASSES } from "@/game/data/classes";
import { GENERAL_LINES, MONSTER_LINES, WEAPON_LINES } from "@/game/data/reportTexts";

import { createRng } from "./rng";
import { ReportBuilder, elementInstrumental, formatDamage, formatHeal } from "./report";
import type { BattleOutcome, HeroConfig, MonsterConfig } from "./types";

export interface ReportContext {
  heroName: string;
  monster: MonsterConfig;
  hero: HeroConfig;
  experience: number;
  gold: number;
}

function declineNumberWord(amount: number, forms: [string, string, string]): string {
  const n = Math.abs(Math.trunc(amount));
  const lastDigit = n % 10;
  const lastTwoDigits = n % 100;
  if (n === 1) return forms[0];
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) return forms[1];
  return forms[2];
}

function formatExperience(amount: number): string {
  return `${amount} ${declineNumberWord(amount, ["punkt doświadczenia", "punkty doświadczenia", "punktów doświadczenia"])}`;
}

function formatGold(amount: number): string {
  return `${amount} ${declineNumberWord(amount, ["złoto", "złota", "złota"])}`;
}

/** Zamienia przebieg walki (simulate.ts) na linie raportu po polsku. */
export function generateReport(outcome: BattleOutcome, ctx: ReportContext, seed: number): string[] {
  // Osobny generator liczb losowych dla doboru linii – ten sam seed co walka,
  // ale inna "ścieżka" liczb, więc wybór tekstu nie wpływa na losowanie walki.
  const rng = createRng(seed ^ 0x9e3779b9);
  const builder = new ReportBuilder(rng);
  const weaponPool = WEAPON_LINES[CLASSES[ctx.hero.classKey].weaponType];
  const monsterPool = MONSTER_LINES[ctx.monster.type];

  const A = ctx.heroName;
  const C = ctx.monster.name;

  builder.push(ctx.monster.isBoss ? GENERAL_LINES.battleStartBoss : GENERAL_LINES.battleStart, { A, C });

  for (const event of outcome.events) {
    if (event.kind === "heal") {
      builder.push(GENERAL_LINES.healSelf, { A, LECZ: formatHeal(event.amount) });
      continue;
    }

    if (event.kind === "status") {
      builder.pushLiteral(event.text);
      continue;
    }

    if (event.actor === "hero") {
      if (event.blocked) continue; // bohater nie blokuje własnych ciosów
      if (!event.hit) {
        builder.push(weaponPool.miss, { A, C });
        continue;
      }
      const pool = event.crit ? weaponPool.crit : weaponPool.hit;
      builder.push(pool, {
        A,
        C,
        OBR: formatDamage(event.damage),
        ZYW: elementInstrumental(event.element),
      });
      if (event.weakHit) builder.pushLiteral(GENERAL_LINES.weaknessLine[0].replace("{C}", C).replace("{ZYW}", elementInstrumental(event.element)));
      if (event.resistHit) builder.pushLiteral(GENERAL_LINES.resistLine[0].replace("{C}", C).replace("{ZYW}", elementInstrumental(event.element)));
      continue;
    }

    // atak potwora
    if (event.blocked) {
      builder.push(GENERAL_LINES.shieldBlock, { A, C });
      continue;
    }
    if (!event.hit) {
      builder.push(monsterPool.miss, { A: C, C: A });
      continue;
    }
    builder.push(monsterPool.hit, { A: C, C: A, OBR: formatDamage(event.damage) });
    if (event.crit) {
      builder.pushLiteral(GENERAL_LINES.monsterCritSuffix[Math.floor(rng() * GENERAL_LINES.monsterCritSuffix.length)]);
    }
  }

  switch (outcome.result) {
    case "WIN":
      builder.push(GENERAL_LINES.victory, { A, C, PD: formatExperience(ctx.experience), ZLOTO: formatGold(ctx.gold) });
      break;
    case "LOSE":
      builder.push(GENERAL_LINES.defeat, { A, C });
      break;
    case "DRAW":
      builder.push(GENERAL_LINES.draw, { A, C });
      break;
    case "RETREAT":
      builder.push(GENERAL_LINES.retreat, { A, C });
      break;
  }

  return builder.toArray();
}
