import { NextResponse } from "next/server";

import { auth } from "@/auth";
import type { ChatChannelKey } from "@/lib/chat";
import { listMessages, postMessage } from "@/lib/chat";
import { getCharacterForUser } from "@/lib/expeditions";

const CHANNELS: ChatChannelKey[] = ["GENERAL", "TRADE", "GUILD", "DM"];

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  const character = await getCharacterForUser(session.user.id);
  if (!character) return NextResponse.json({ error: "Nie masz jeszcze bohatera." }, { status: 404 });

  const url = new URL(request.url);
  const channel = url.searchParams.get("channel") as ChatChannelKey;
  if (!CHANNELS.includes(channel)) return NextResponse.json({ error: "Nieznany kanał." }, { status: 400 });
  const withCharacterId = url.searchParams.get("withCharacterId") ?? undefined;

  const messages = await listMessages(character.id, channel, { withCharacterId });
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  const character = await getCharacterForUser(session.user.id);
  if (!character) return NextResponse.json({ error: "Nie masz jeszcze bohatera." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const channel = body?.channel as ChatChannelKey;
  const content = typeof body?.content === "string" ? body.content : "";
  const recipientCharacterId = typeof body?.recipientCharacterId === "string" ? body.recipientCharacterId : undefined;
  if (!CHANNELS.includes(channel)) return NextResponse.json({ error: "Nieznany kanał." }, { status: 400 });

  const result = await postMessage(character.id, channel, content, { recipientCharacterId });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
