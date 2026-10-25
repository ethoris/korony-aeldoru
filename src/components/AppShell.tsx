"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Icon } from "./icons";
import type { IconName } from "./icons";
import { ThemeToggle } from "./ThemeToggle";

const MAX_STAMINA = 100;
const REGEN_MS_PER_POINT = 3 * 60 * 1000;

interface NavLink {
  href: string;
  label: string;
}

interface NavGroup {
  icon: IconName;
  label: string;
  links: NavLink[];
}

const PRIMARY: { href: string; label: string; icon: IconName }[] = [
  { href: "/character", label: "Bohater", icon: "bohater" },
  { href: "/expeditions", label: "Wyprawy", icon: "wyprawy" },
  { href: "/twierdza", label: "Twierdza", icon: "twierdza" },
];

function buildGroups(isStaff: boolean): NavGroup[] {
  return [
    {
      icon: "miasto",
      label: "Miasto",
      links: [
        { href: "/targowisko", label: "Targowisko" },
        { href: "/sklep", label: "Sklep" },
        { href: "/czat", label: "Czat" },
        { href: "/gildia", label: "Gildia" },
      ],
    },
    {
      icon: "wiecej",
      label: "Więcej",
      links: [
        { href: "/inventory", label: "Ekwipunek" },
        { href: "/pvp", label: "PvP" },
        { href: "/napady", label: "Napady" },
        { href: "/mapa", label: "Mapa" },
        { href: "/bostwo", label: "Bóstwo" },
        { href: "/ranking", label: "Ranking" },
        { href: "/quests", label: "Zadania" },
        { href: "/konto", label: "Konto" },
        ...(isStaff ? [{ href: "/admin", label: "Panel admina" }] : []),
      ],
    },
  ];
}

/** Minuty:sekundy do pełnej wytrwałości, liczone na żywo z ostatniego zapisu z serwera. */
function useStaminaCountdown(stamina: number, staminaUpdatedAt: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (stamina >= MAX_STAMINA) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [stamina]);

  if (stamina >= MAX_STAMINA) return { current: MAX_STAMINA, label: null as string | null };

  const updatedAtMs = new Date(staminaUpdatedAt).getTime();
  const elapsedMs = Math.max(0, now - updatedAtMs);
  const gained = Math.floor(elapsedMs / REGEN_MS_PER_POINT);
  const current = Math.min(MAX_STAMINA, stamina + gained);
  if (current >= MAX_STAMINA) return { current: MAX_STAMINA, label: null as string | null };

  const msToNextPoint = REGEN_MS_PER_POINT - (elapsedMs % REGEN_MS_PER_POINT);
  const pointsLeft = MAX_STAMINA - current;
  const msToFull = msToNextPoint + (pointsLeft - 1) * REGEN_MS_PER_POINT;
  const totalSeconds = Math.max(0, Math.floor(msToFull / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const label = h > 0 ? `${h}h ${m}min do pełnej` : `${m}min do pełnej`;

  return { current, label };
}

function Bar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div
        className="h-full rounded-full transition-[width] duration-200"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%`, background: color }}
      />
    </div>
  );
}

function NavButton({ href, label, icon, active }: { href: string; label: string; icon: IconName; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[11px] font-ui ${
        active ? "text-accent" : "text-muted"
      }`}
    >
      <Icon name={icon} className="h-5 w-5" />
      {label}
    </Link>
  );
}

export function AppShell({
  character,
  isStaff,
  children,
}: {
  character: {
    name: string;
    level: number;
    experience: number;
    nextLevelXp: number;
    stamina: number;
    staminaUpdatedAt: string;
  };
  isStaff: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const groups = buildGroups(isStaff);
  const { current: staminaNow, label: staminaLabel } = useStaminaCountdown(
    character.stamina,
    character.staminaUpdatedAt,
  );

  const xpPercent = character.nextLevelXp > 0 ? (character.experience / character.nextLevelXp) * 100 : 0;
  const staminaPercent = (staminaNow / MAX_STAMINA) * 100;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const activeGroup = groups.find((g) => g.links.some((l) => isActive(l.href)));

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      {/* Boczny panel bohatera (komputer), docs/gdd/14-wyglad.md */}
      <aside className="hidden w-56 shrink-0 flex-col gap-4 border-r border-line bg-card p-4 md:flex">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-wide text-accent">{character.name}</p>
          <p className="text-xs text-muted">Poziom {character.level}</p>
          <div className="mt-2 flex flex-col gap-1.5">
            <Bar percent={xpPercent} color="var(--color-accent)" />
            <Bar percent={staminaPercent} color="var(--color-info)" />
          </div>
          {staminaLabel && <p className="mt-1 text-[11px] text-muted">Wytrwałość: {staminaLabel}</p>}
        </div>

        <nav className="flex flex-col gap-1">
          {PRIMARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                isActive(item.href) ? "bg-background text-accent" : "text-foreground hover:bg-background"
              }`}
            >
              <Icon name={item.icon} className="h-4 w-4" />
              {item.label}
            </Link>
          ))}

          {groups.map((group) => (
            <div key={group.label} className="mt-2">
              <p className="px-2 text-[11px] uppercase tracking-wide text-muted">{group.label}</p>
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center rounded px-2 py-1.5 text-sm ${
                    isActive(link.href) ? "bg-background text-accent" : "text-foreground hover:bg-background"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-auto">
          <ThemeToggle />
        </div>
      </aside>

      {/* Górny pasek (telefon), docs/gdd/14-wyglad.md */}
      <header className="flex items-center justify-between gap-3 border-b border-line bg-card px-4 py-2 md:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">
            {character.name} <span className="text-muted">· poz. {character.level}</span>
          </p>
          <div className="mt-1 flex flex-col gap-1">
            <Bar percent={xpPercent} color="var(--color-accent)" />
            <Bar percent={staminaPercent} color="var(--color-info)" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col pb-16 md:pb-0">{children}</div>

      {/* Dolne menu (telefon), docs/gdd/14-wyglad.md: 5 pozycji */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-card md:hidden">
        {PRIMARY.map((item) => (
          <div key={item.href} className="flex-1">
            <NavButton href={item.href} label={item.label} icon={item.icon} active={isActive(item.href)} />
          </div>
        ))}
        {groups.map((group) => (
          <button
            key={group.label}
            type="button"
            onClick={() => setOpenGroup((g) => (g === group.label ? null : group.label))}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[11px] font-ui ${
              activeGroup?.label === group.label || openGroup === group.label ? "text-accent" : "text-muted"
            }`}
          >
            <Icon name={group.icon} className="h-5 w-5" />
            {group.label}
          </button>
        ))}
      </nav>

      {openGroup && (
        <div
          className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40 md:hidden"
          onClick={() => setOpenGroup(null)}
        >
          <div
            className="rounded-t-lg border-t border-line bg-card p-4 pb-20"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-2 text-xs uppercase tracking-wide text-muted">{openGroup}</p>
            <div className="flex flex-col gap-1">
              {groups
                .find((g) => g.label === openGroup)
                ?.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpenGroup(null)}
                    className={`rounded px-3 py-2 text-sm ${
                      isActive(link.href) ? "bg-background text-accent" : "text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
