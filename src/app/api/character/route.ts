import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { CLASSES } from "@/game/data/classes";
import { DEITIES } from "@/game/data/deities";
import { baseStatsForRace, RACES } from "@/game/data/races";
import { createStarterGear } from "@/game/items/starterGear";
import { characterNameKey, validateCharacterName } from "@/lib/validation/characterName";
import { prisma } from "@/lib/prisma";

const SERVER = "Valmor";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ errors: { form: "Nieprawidłowe dane formularza." } }, { status: 400 });
  }

  const { name, race, class: classKey, deity } = body as Record<string, unknown>;

  const errors: Record<string, string> = {};

  if (typeof race !== "string" || !(race in RACES)) errors.race = "Wybierz rasę.";
  if (typeof classKey !== "string" || !(classKey in CLASSES)) errors.class = "Wybierz klasę.";
  if (typeof deity !== "string" || !(deity in DEITIES)) errors.deity = "Wybierz bóstwo.";

  const nameValidation = typeof name === "string" ? validateCharacterName(name) : { ok: false as const, error: "Podaj imię." };
  if (!nameValidation.ok) errors.name = nameValidation.error ?? "Nieprawidłowe imię.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const existing = await prisma.character.findUnique({
    where: { userId_server: { userId: session.user.id, server: SERVER } },
  });
  if (existing) {
    return NextResponse.json({ errors: { form: "Masz już bohatera na tym serwerze." } }, { status: 409 });
  }

  const nameKey = characterNameKey(name as string);
  const nameTaken = await prisma.character.findUnique({
    where: { server_nameKey: { server: SERVER, nameKey } },
  });
  if (nameTaken) {
    return NextResponse.json({ errors: { name: "To imię jest już zajęte." } }, { status: 409 });
  }

  const stats = baseStatsForRace(race as keyof typeof RACES);
  const starterGear = createStarterGear(classKey as keyof typeof CLASSES);

  const character = await prisma.character.create({
    data: {
      userId: session.user.id,
      server: SERVER,
      name: name as string,
      nameKey,
      race: race as keyof typeof RACES,
      class: classKey as keyof typeof CLASSES,
      deity: deity as keyof typeof DEITIES,
      ...stats,
      items: {
        create: starterGear.map((item) => ({
          name: item.name,
          slot: item.slot,
          level: item.level,
          quality: item.quality,
          forClass: item.forClass,
          damageMin: item.damageMin,
          damageMax: item.damageMax,
          armor: item.armor,
          traits: JSON.parse(JSON.stringify(item.affixes)),
          location: "EQUIPPED",
        })),
      },
    },
  });

  await prisma.gameEvent.create({
    data: {
      userId: session.user.id,
      characterId: character.id,
      type: "utworzenie bohatera",
      details: { race: race as string, class: classKey as string, deity: deity as string },
    },
  });

  return NextResponse.json({ ok: true, characterId: character.id });
}
