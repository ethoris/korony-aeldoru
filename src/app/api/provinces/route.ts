import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getMapState, getRegionLords } from "@/lib/provinces";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });

  const [provinces, lords] = await Promise.all([getMapState(), getRegionLords()]);
  return NextResponse.json({ provinces, lords });
}
