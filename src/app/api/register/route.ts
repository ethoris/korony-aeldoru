import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { validateRegistrationInput } from "@/lib/validation/registration";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ errors: { form: "Nieprawidłowe dane formularza." } }, { status: 400 });
  }

  const { email, password, ageConfirmed } = body as Record<string, unknown>;

  const validation = validateRegistrationInput({
    email: typeof email === "string" ? email : "",
    password: typeof password === "string" ? password : "",
    ageConfirmed: ageConfirmed === true,
  });

  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: validation.email } });
  if (existing) {
    return NextResponse.json(
      { errors: { email: "Ten adres e-mail jest już zarejestrowany." } },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password as string);

  const user = await prisma.user.create({
    data: {
      email: validation.email,
      passwordHash,
      ageConfirmed: true,
    },
  });

  await prisma.gameEvent.create({
    data: { userId: user.id, type: "rejestracja", details: {} },
  });

  return NextResponse.json({ ok: true });
}
