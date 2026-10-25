import { Icon } from "./icons";

export interface ReportLineView {
  text: string;
  element?: string;
  crit?: boolean;
  variant?: "victory" | "defeat" | "draw" | "retreat" | "heal" | "loot";
}

const ELEMENT_COLOR: Record<string, string> = {
  physical: "var(--color-element-physical)",
  fire: "var(--color-element-fire)",
  ice: "var(--color-element-ice)",
  lightning: "var(--color-element-lightning)",
  light: "var(--color-element-light)",
  shadow: "var(--color-element-shadow)",
  poison: "var(--color-element-poison)",
};

const VARIANT_CLASS: Record<string, string> = {
  victory: "font-bold text-success",
  defeat: "font-bold text-danger",
  draw: "font-bold text-muted",
  retreat: "font-bold text-muted",
  heal: "text-success",
  loot: "font-semibold text-accent",
};

// Dopasowuje sformatowaną frazę obrażeń z formatDamage() (src/game/combat/report.ts):
// "<liczba> obrażenie|obrażenia|obrażeń".
const DAMAGE_PATTERN = /\d+ (?:obrażenie|obrażenia|obrażeń)/;

/** Pogrubia i koloruje liczbę obrażeń w kolorze żywiołu (docs/gdd/14-wyglad.md). */
function renderLineText(text: string, element?: string): React.ReactNode {
  if (!element) return text;
  const match = text.match(DAMAGE_PATTERN);
  if (!match) return text;
  const full = match[0];
  const idx = match.index ?? text.indexOf(full);
  const before = text.slice(0, idx);
  const after = text.slice(idx + full.length);
  return (
    <>
      {before}
      <strong style={{ color: ELEMENT_COLOR[element] }}>{full}</strong>
      {after}
    </>
  );
}

/** Raport walki w stylu kroniki: inicjał Cinzel na pierwszej linii, kolorowe obrażenia, ikona krytyka. */
export function BattleReportView({ lines }: { lines: ReportLineView[] }) {
  return (
    <div className="font-body flex flex-col gap-2 text-foreground">
      {lines.map((line, i) => (
        <p key={i} className={VARIANT_CLASS[line.variant ?? ""] ?? ""}>
          {i === 0 && line.text.length > 0 ? (
            <>
              <span className="font-display text-xl text-accent">{line.text.charAt(0)}</span>
              {line.text.slice(1)}
            </>
          ) : (
            renderLineText(line.text, line.element)
          )}
          {line.crit && (
            <Icon name="krytyk" className="ml-1 inline-block h-3.5 w-3.5 align-middle text-danger" />
          )}
        </p>
      ))}
    </div>
  );
}
