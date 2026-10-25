import { CLASSES } from "@/game/data/classes";
import { GENERAL_LINES, WEAPON_LINES } from "@/game/data/reportTexts";

import { formatExperience, formatGold } from "./generateReport";
import { createRng } from "./rng";
import { ReportBuilder, elementInstrumental, formatDamage } from "./report";
import type { ReportLine } from "./report";
import type { BattleOutcome, ClassKey } from "./types";

export interface PvpReportContext {
  attackerName: string;
  attackerClass: ClassKey;
  defenderName: string;
  defenderClass: ClassKey;
  experience: number;
  gold: number;
}

/** Jak generateReport.ts, ale dla pojedynku PvP: obie strony to bohaterowie, więc obie używają puli broni (bez puli potworów). */
export function generatePvpReport(outcome: BattleOutcome, ctx: PvpReportContext, seed: number): ReportLine[] {
  const rng = createRng(seed ^ 0x9e3779b9);
  const builder = new ReportBuilder(rng);
  const attackerWeapons = WEAPON_LINES[CLASSES[ctx.attackerClass].weaponType];
  const defenderWeapons = WEAPON_LINES[CLASSES[ctx.defenderClass].weaponType];

  const A = ctx.attackerName;
  const C = ctx.defenderName;

  builder.push(GENERAL_LINES.battleStart, { A, C });

  for (const event of outcome.events) {
    if (event.kind !== "attack") continue;

    const actingIsAttacker = event.actor === "hero";
    const actor = actingIsAttacker ? A : C;
    const target = actingIsAttacker ? C : A;
    const pool = actingIsAttacker ? attackerWeapons : defenderWeapons;

    if (event.blocked) {
      builder.push(GENERAL_LINES.shieldBlock, { A: target, C: actor });
      continue;
    }
    if (!event.hit) {
      builder.push(pool.miss, { A: actor, C: target });
      continue;
    }
    const hitPool = event.crit ? pool.crit : pool.hit;
    builder.push(
      hitPool,
      { A: actor, C: target, OBR: formatDamage(event.damage), ZYW: elementInstrumental(event.element) },
      { element: event.element, crit: event.crit },
    );
  }

  switch (outcome.result) {
    case "WIN":
      builder.push(
        GENERAL_LINES.victory,
        { A, C, PD: formatExperience(ctx.experience), ZLOTO: formatGold(ctx.gold) },
        { variant: "victory" },
      );
      break;
    case "LOSE":
      builder.push(GENERAL_LINES.defeat, { A, C }, { variant: "defeat" });
      break;
    default:
      builder.push(GENERAL_LINES.draw, { A, C }, { variant: "draw" });
      break;
  }

  return builder.toArray();
}
