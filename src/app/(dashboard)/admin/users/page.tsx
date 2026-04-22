import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserAdmin } from "@/components/admin/user-admin";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/calculator");
  }

  const users = await db.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Brukere</h1>
        <p className="text-sm text-slate-500">
          Opprett, rediger og slett brukere. Kun administratorer har tilgang til denne siden.
        </p>
      </div>

      <UserAdmin
        initialUsers={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        currentUserId={session.user.id}
      />
    </div>
  );
}
