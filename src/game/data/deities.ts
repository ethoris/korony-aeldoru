export type DeityKey = "SOLARIS" | "KORGATH" | "ILYRA" | "VEYL" | "MARDUN" | "THESSA" | "MORRAK";

export interface DeityDefinition {
  key: DeityKey;
  name: string;
  domain: string;
  bonus: string;
}

// docs/gdd/00-glowny.md – bonusy bóstw (zdobywane od stworzenia postaci;
// sama mechanika bonusu jest wliczona w silnik walki/wyprawy w kolejnych krokach).
export const DEITIES: Record<DeityKey, DeityDefinition> = {
  SOLARIS: { key: "SOLARIS", name: "Solaris", domain: "światło, uzdrawianie", bonus: "+10% skuteczności leczenia i zaklęć ochronnych" },
  KORGATH: { key: "KORGATH", name: "Korgath", domain: "wojna, stal", bonus: "+5% obrażeń w walce wręcz" },
  ILYRA: { key: "ILYRA", name: "Ilyra", domain: "magia, gwiazdy", bonus: "+10% doświadczenia z wypraw" },
  VEYL: { key: "VEYL", name: "Veyl", domain: "cienie, podstęp", bonus: "+5% szansy na trafienie krytyczne" },
  MARDUN: { key: "MARDUN", name: "Mardun", domain: "handel, złoto", bonus: "+10% złota z wypraw i handlu" },
  THESSA: { key: "THESSA", name: "Thessa", domain: "natura, łowy", bonus: "+5% celności broni dystansowej" },
  MORRAK: { key: "MORRAK", name: "Morrak", domain: "śmierć, przeznaczenie", bonus: "25% mniejsze straty po przegranej walce" },
};
