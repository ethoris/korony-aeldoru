import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { grantItem } from "@/lib/admin";
import type { GrantItemInput } from "@/lib/admin";

export async function POST(request: Request, { params }: { params: Promise<{ characterId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });

  const { characterId } = await params;
  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason : "";
  const item: GrantItemInput = {
    name: typeof body?.name === "string" ? body.name : "",
    slot: body?.slot,
    level: typeof body?.level === "number" ? body.level : 1,
    quality: body?.quality,
    forClass: body?.forClass,
    damageMin: typeof body?.damageMin === "number" ? body.damageMin : undefined,
    damageMax: typeof body?.damageMax === "number" ? body.damageMax : undefined,
    armor: typeof body?.armor === "number" ? body.armor : undefined,
  };
  if (!item.name || !item.slot || !item.quality || !item.forClass) {
    return NextResponse.json({ error: "Uzupełnij nazwę, slot, jakość i klasę." }, { status: 400 });
  }

  const result = await grantItem(session.user.id, characterId, item, reason);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
