import type { Element } from "./types";
import type { Rng } from "./rng";

/** Odmiana liczebnika dla obrażeń/leczenia (docs/gdd/03-teksty-raportow.md). */
export function declineDamageWord(amount: number): string {
  const n = Math.abs(Math.trunc(amount));
  const lastDigit = n % 10;
  const lastTwoDigits = n % 100;

  if (n === 1) return "obrażenie";
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) {
    return "obrażenia";
  }
  return "obrażeń";
}

export function formatDamage(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded} ${declineDamageWord(rounded)}`;
}

function declineHpWord(amount: number): string {
  const n = Math.abs(Math.trunc(amount));
  const lastDigit = n % 10;
  const lastTwoDigits = n % 100;

  if (n === 1) return "punkt życia";
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) {
    return "punkty życia";
  }
  return "punktów życia";
}

export function formatHeal(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded} ${declineHpWord(rounded)}`;
}

const ELEMENT_INSTRUMENTAL: Record<Element, string> = {
  physical: "siłą",
  fire: "ogniem",
  ice: "lodem",
  lightning: "błyskawicą",
  light: "światłem",
  shadow: "cieniem",
  poison: "trucizną",
};

export function elementInstrumental(element: Element): string {
  return ELEMENT_INSTRUMENTAL[element];
}

export type LineVars = Partial<{
  A: string;
  C: string;
  OBR: string;
  ZYW: string;
  LECZ: string;
  ZDOL: string;
  MIKS: string;
  LUP: string;
  PD: string;
  ZLOTO: string;
}>;

export function fillTemplate(template: string, vars: LineVars): string {
  return template.replace(/\{(A|C|OBR|ZYW|LECZ|ZDOL|MIKS|LUP|PD|ZLOTO)\}/g, (_match, key: keyof LineVars) => {
    return vars[key] ?? `{${key}}`;
  });
}

/**
 * Wybiera linię z puli, bez powtórzenia tej samej linii co ostatnio w raporcie
 * (docs/gdd/03-teksty-raportow.md: „bez powtórzenia tej samej linii dwa razy z rzędu”).
 */
export class ReportBuilder {
  private readonly lines: string[] = [];
  private lastRawLine: string | null = null;

  constructor(private readonly rng: Rng) {}

  push(pool: readonly string[], vars: LineVars): string {
    let template = pool[Math.floor(this.rng() * pool.length)];
    if (pool.length > 1 && template === this.lastRawLine) {
      const index = pool.indexOf(template);
      template = pool[(index + 1) % pool.length];
    }
    this.lastRawLine = template;
    const line = fillTemplate(template, vars);
    this.lines.push(line);
    return line;
  }

  pushLiteral(line: string): void {
    this.lastRawLine = line;
    this.lines.push(line);
  }

  toArray(): string[] {
    return [...this.lines];
  }
}
