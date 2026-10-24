import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { listReports } from "@/lib/chat";

import { ModerationClient } from "./ModerationClient";

export const instant = false;

export default async function ModerationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN") {
    redirect("/character");
  }

  const reports = await listReports();

  return (
    <main className="flex flex-1 justify-center p-4">
      <ModerationClient reports={reports.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} />
    </main>
  );
}
