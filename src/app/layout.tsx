import type { Metadata } from "next";
import { Cinzel, Crimson_Pro, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
});

const crimsonPro = Crimson_Pro({
  variable: "--font-crimson",
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Korony Aeldoru",
  description: "Tekstowa gra MMORPG fantasy w przeglądarce.",
};

// Ustawia data-theme z localStorage przed pierwszym malowaniem strony, żeby
// przełącznik ciemny/pergamin (docs/gdd/14-wyglad.md, src/components/ThemeToggle.tsx)
// nie powodował mignięcia złym motywem przy wczytywaniu.
const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      suppressHydrationWarning
      className={`${cinzel.variable} ${crimsonPro.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-ui">
        {children}
        <footer className="flex justify-center gap-4 border-t border-line p-4 text-xs text-muted">
          <Link href="/regulamin" className="underline">Regulamin</Link>
          <Link href="/polityka-prywatnosci" className="underline">Polityka prywatności</Link>
          <Link href="/o-grze" className="underline">O grze</Link>
        </footer>
      </body>
    </html>
  );
}
