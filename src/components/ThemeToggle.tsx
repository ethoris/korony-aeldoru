"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

/** Przełącznik ciemny/pergamin (docs/gdd/14-wyglad.md). Zapis per-urządzenie w localStorage; brak FOUC dzięki skryptowi w <head> (src/app/layout.tsx). */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // Odczyt stanu zewnętrznego (atrybut ustawiony przez skrypt anty-FOUC w
    // src/app/layout.tsx) po zamontowaniu – inaczej serwer nie znałby
    // localStorage i etykieta przycisku byłaby błędna do pierwszego kliknięcia.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage niedostępny (prywatne okno itp.) – przełącznik działa tylko w tej sesji.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="w-full rounded border border-line px-2 py-1.5 text-xs text-foreground hover:bg-background"
    >
      {theme === "dark" ? "☾ Tryb ciemny" : "☀ Tryb pergamin"}
    </button>
  );
}
