// Wartości identyczne z enumami Prisma (ItemSlot/ItemQuality) – ten plik
// jest częścią czystego modułu gry (bez bazy), Prisma mapuje się na te
// same stringi przy zapisie.
export type ItemSlot = "WEAPON" | "OFFHAND" | "HELMET" | "ARMOR" | "GLOVES" | "BOOTS" | "AMULET" | "RING";

export type ItemQuality = "COMMON" | "MAGIC" | "RARE" | "LEGENDARY";

export interface ItemAffixInstance {
  key: string;
  value: number;
  label: string;
  element?: import("@/game/combat/types").Element;
}

export interface GeneratedItem {
  slot: ItemSlot;
  level: number;
  quality: ItemQuality;
  name: string;
  damageMin?: number;
  damageMax?: number;
  armor?: number;
  affixes: ItemAffixInstance[];
  /** Klasa, dla której wygenerowano przedmiot (wpływa na typ broni/mnożnik pancerza). */
  forClass: import("@/game/combat/types").ClassKey;
}
