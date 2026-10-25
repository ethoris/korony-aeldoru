import { connection } from "next/server";

import { getMaintenanceMode } from "@/lib/admin";

export const instant = false;

export default async function MaintenancePage() {
  await connection();
  const { message } = await getMaintenanceMode();

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-card p-6 text-center">
        <h1 className="font-display text-xl font-bold uppercase tracking-wide text-accent">Przerwa techniczna</h1>
        <p className="mt-3 text-sm text-foreground">{message || "Gra jest chwilowo niedostępna. Wróć później."}</p>
      </div>
    </main>
  );
}
