import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getMaintenanceMode, listAdminActions } from "@/lib/admin";

import { AdminClient } from "./AdminClient";

export const instant = false;

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    redirect("/character");
  }

  const maintenance = await getMaintenanceMode();
  const actions = await listAdminActions(30);

  return (
    <main className="flex flex-1 justify-center p-4">
      <AdminClient
        isFullAdmin={session.user.role === "ADMIN"}
        maintenance={maintenance}
        actions={actions.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
      />
    </main>
  );
}
