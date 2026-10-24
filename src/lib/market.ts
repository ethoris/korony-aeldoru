import "server-only";

import type { ResourceKey } from "@/game/data/buildings";
import { marketTaxPercent } from "@/game/fortress/formulas";
import { parseSetTemplateKey } from "@/game/data/sets";

import { checkDeityQuests, recordMarketSaleSignal } from "./deityQuests";
import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";

/** GDD nie podaje czasu wygasania ofert – własna decyzja (do przeglądu): 48 h. */
export const MARKET_OFFER_DURATION_HOURS = 48;

const RESOURCE_KEYS: ResourceKey[] = ["wood", "stone", "iron", "food", "mana"];

function targowiskoLevel(buildingLevels: Prisma.JsonValue): number {
  if (buildingLevels && typeof buildingLevels === "object" && !Array.isArray(buildingLevels)) {
    const value = (buildingLevels as Record<string, unknown>).TARGOWISKO;
    if (typeof value === "number") return value;
  }
  return 0;
}

/** Zwraca do sprzedawcy przedmioty/surowce z wygasłych, nieodkupionych ofert. */
async function expireStaleOffers(tx: Prisma.TransactionClient, server: string): Promise<void> {
  const stale = await tx.marketOffer.findMany({
    where: { soldAt: null, expiresAt: { lte: new Date() }, sellerCharacter: { server } },
  });
  for (const offer of stale) {
    if (offer.itemId) {
      await tx.item.update({ where: { id: offer.itemId }, data: { location: "BACKPACK" } });
    } else if (offer.resourceKey) {
      await tx.fortress.update({
        where: { characterId: offer.sellerCharacterId },
        data: { [offer.resourceKey]: { increment: offer.quantity } },
      });
    }
    await tx.marketOffer.delete({ where: { id: offer.id } });
  }
}

export interface MarketOfferView {
  id: string;
  sellerName: string;
  kind: "item" | "resource";
  itemName: string | null;
  itemQuality: string | null;
  resourceKey: ResourceKey | null;
  quantity: number;
  price: number;
  expiresAt: Date;
}

export async function listOffers(server: string): Promise<MarketOfferView[]> {
  await prisma.$transaction((tx) => expireStaleOffers(tx, server));

  const offers = await prisma.marketOffer.findMany({
    where: { soldAt: null, sellerCharacter: { server } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { sellerCharacter: true, item: true },
  });

  return offers.map((o) => ({
    id: o.id,
    sellerName: o.sellerCharacter.name,
    kind: o.itemId ? "item" : "resource",
    itemName: o.item?.name ?? null,
    itemQuality: o.item?.quality ?? null,
    resourceKey: (o.resourceKey as ResourceKey) ?? null,
    quantity: o.quantity,
    price: o.price,
    expiresAt: o.expiresAt,
  }));
}

export type CreateOfferResult = { ok: true; offerId: string } | { error: string };

/** Wystawia przedmiot na targowisko (nie zestawy – docs/gdd/08-ekwipunek.md: części zestawów tylko wymiana w gildii). */
export async function createItemOffer(characterId: string, itemId: string, price: number): Promise<CreateOfferResult> {
  if (!Number.isInteger(price) || price <= 0) return { error: "Nieprawidłowa cena." };

  return prisma.$transaction(async (tx) => {
    const fortress = await tx.fortress.findUnique({ where: { characterId } });
    if (!fortress || targowiskoLevel(fortress.buildingLevels) < 1) {
      return { error: "Potrzebujesz Targowiska poziomu 1 w twierdzy." };
    }

    const item = await tx.item.findUnique({ where: { id: itemId } });
    if (!item || item.characterId !== characterId) return { error: "Nie masz tego przedmiotu." };
    if (item.locked) return { error: "Przedmiot jest zablokowany kłódką." };
    if (item.location !== "BACKPACK" && item.location !== "STASH") {
      return { error: "Zdejmij przedmiot przed wystawieniem." };
    }
    if (parseSetTemplateKey(item.templateKey)) {
      return { error: "Części zestawów można tylko wymienić w gildii, nie sprzedać na targowisku." };
    }

    const expiresAt = new Date(Date.now() + MARKET_OFFER_DURATION_HOURS * 60 * 60 * 1000);
    await tx.item.update({ where: { id: itemId }, data: { location: "MARKET" } });
    const offer = await tx.marketOffer.create({
      data: { sellerCharacterId: characterId, itemId, price, expiresAt },
    });
    await tx.itemEvent.create({ data: { itemId, characterId, type: "MOVED", reason: "wystawiono na targowisku" } });

    return { ok: true, offerId: offer.id };
  });
}

export async function createResourceOffer(
  characterId: string,
  resourceKey: ResourceKey,
  quantity: number,
  price: number,
): Promise<CreateOfferResult> {
  if (!Number.isInteger(price) || price <= 0) return { error: "Nieprawidłowa cena." };
  if (!Number.isInteger(quantity) || quantity <= 0) return { error: "Nieprawidłowa ilość." };
  if (!RESOURCE_KEYS.includes(resourceKey)) return { error: "Nieprawidłowy surowiec." };

  return prisma.$transaction(async (tx) => {
    const fortress = await tx.fortress.findUnique({ where: { characterId } });
    if (!fortress) return { error: "Nie masz jeszcze twierdzy." };
    if (targowiskoLevel(fortress.buildingLevels) < 1) return { error: "Potrzebujesz Targowiska poziomu 1 w twierdzy." };

    const available = fortress[resourceKey] as number;
    if (available < quantity) return { error: `Masz tylko ${available} tego surowca.` };

    await tx.fortress.update({ where: { characterId }, data: { [resourceKey]: available - quantity } });

    const expiresAt = new Date(Date.now() + MARKET_OFFER_DURATION_HOURS * 60 * 60 * 1000);
    const offer = await tx.marketOffer.create({
      data: { sellerCharacterId: characterId, resourceKey, quantity, price, expiresAt },
    });

    return { ok: true, offerId: offer.id };
  });
}

export type BuyOfferResult = { ok: true } | { error: string };

export async function buyOffer(characterId: string, offerId: string): Promise<BuyOfferResult> {
  return prisma.$transaction(async (tx) => {
    const offer = await tx.marketOffer.findUnique({ where: { id: offerId } });
    if (!offer || offer.soldAt) return { error: "Ta oferta już nie jest dostępna." };
    if (offer.expiresAt <= new Date()) return { error: "Ta oferta wygasła." };
    if (offer.sellerCharacterId === characterId) return { error: "Nie możesz kupić własnej oferty." };

    const buyer = await tx.character.findUniqueOrThrow({ where: { id: characterId } });
    const seller = await tx.character.findUniqueOrThrow({ where: { id: offer.sellerCharacterId } });
    if (buyer.server !== seller.server) return { error: "Ten gracz jest na innym serwerze." };
    if (buyer.goldPouch < offer.price) return { error: `Potrzebujesz ${offer.price} złota, masz ${buyer.goldPouch}.` };

    const sellerFortress = await tx.fortress.findUnique({ where: { characterId: seller.id } });
    const taxPercent = marketTaxPercent(targowiskoLevel(sellerFortress?.buildingLevels ?? {}));
    const payout = Math.round(offer.price * (1 - taxPercent / 100));

    const newBuyerGold = buyer.goldPouch - offer.price;
    const newSellerGold = seller.goldPouch + payout;
    await tx.character.update({ where: { id: characterId }, data: { goldPouch: newBuyerGold } });
    await tx.character.update({ where: { id: seller.id }, data: { goldPouch: newSellerGold } });
    await tx.goldEvent.create({
      data: { characterId, amount: -offer.price, balanceAfter: newBuyerGold, reason: "targowisko: zakup" },
    });
    await tx.goldEvent.create({
      data: { characterId: seller.id, amount: payout, balanceAfter: newSellerGold, reason: `targowisko: sprzedaż (podatek ${taxPercent}%)` },
    });

    if (offer.itemId) {
      await tx.item.update({ where: { id: offer.itemId }, data: { characterId, location: "BACKPACK" } });
      await tx.itemEvent.create({
        data: { itemId: offer.itemId, characterId, type: "TRADED", reason: `kupiono od ${seller.name}` },
      });
    } else if (offer.resourceKey) {
      const buyerFortress = await tx.fortress.findUnique({ where: { characterId } });
      if (!buyerFortress) return { error: "Potrzebujesz twierdzy, żeby odebrać surowce." };
      await tx.fortress.update({
        where: { characterId },
        data: { [offer.resourceKey]: (buyerFortress[offer.resourceKey as ResourceKey] as number) + offer.quantity },
      });
    }

    await tx.marketOffer.update({ where: { id: offerId }, data: { soldAt: new Date(), buyerCharacterId: characterId } });

    await recordMarketSaleSignal(tx, seller.id, payout);
    await checkDeityQuests(tx, seller.id, seller.level, seller.deity, {
      strength: seller.strength,
      dexterity: seller.dexterity,
      vitality: seller.vitality,
      intellect: seller.intellect,
    });

    return { ok: true };
  });
}

export type CancelOfferResult = { ok: true } | { error: string };

export async function cancelOffer(characterId: string, offerId: string): Promise<CancelOfferResult> {
  return prisma.$transaction(async (tx) => {
    const offer = await tx.marketOffer.findUnique({ where: { id: offerId } });
    if (!offer || offer.sellerCharacterId !== characterId) return { error: "Nie masz takiej oferty." };
    if (offer.soldAt) return { error: "Ta oferta już została kupiona." };

    if (offer.itemId) {
      await tx.item.update({ where: { id: offer.itemId }, data: { location: "BACKPACK" } });
    } else if (offer.resourceKey) {
      await tx.fortress.update({
        where: { characterId },
        data: { [offer.resourceKey]: { increment: offer.quantity } },
      });
    }
    await tx.marketOffer.delete({ where: { id: offerId } });

    return { ok: true };
  });
}

export async function listMyOffers(characterId: string): Promise<MarketOfferView[]> {
  const character = await prisma.character.findUniqueOrThrow({ where: { id: characterId } });
  await prisma.$transaction((tx) => expireStaleOffers(tx, character.server));

  const offers = await prisma.marketOffer.findMany({
    where: { sellerCharacterId: characterId, soldAt: null },
    orderBy: { createdAt: "desc" },
    include: { sellerCharacter: true, item: true },
  });
  return offers.map((o) => ({
    id: o.id,
    sellerName: o.sellerCharacter.name,
    kind: o.itemId ? "item" : "resource",
    itemName: o.item?.name ?? null,
    itemQuality: o.item?.quality ?? null,
    resourceKey: (o.resourceKey as ResourceKey) ?? null,
    quantity: o.quantity,
    price: o.price,
    expiresAt: o.expiresAt,
  }));
}
