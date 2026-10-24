import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { AccountSettingsClient } from "./AccountSettingsClient";

export const instant = false;

export default async function KontoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="flex flex-1 justify-center p-4">
      <AccountSettingsClient email={session.user.email ?? ""} />
    </main>
  );
}
