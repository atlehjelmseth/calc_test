import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminSettingsForm } from "./settings-form";
import { PhoneAdmin } from "@/components/admin/phone-admin";
import { ElectricityAdmin } from "@/components/admin/electricity-admin";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/calculator");
  }

  const [savings, phoneProviders, electricityProviders] = await Promise.all([
    db.savingsSettings.findFirst(),
    db.phoneProvider.findMany({
      where: { active: true },
      include: {
        plans: {
          where: { active: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
    db.electricityProvider.findMany({
      where: { active: true },
      include: {
        plans: {
          where: { active: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Administrasjon</h1>
        <p className="text-sm text-slate-500">
          Endre besparelsesparametere som brukes i kalkulatoren. Endringer trer i kraft umiddelbart.
        </p>
      </div>

      <div className="space-y-5">
        <AdminSettingsForm
          initialSavings={{
            id: savings?.id ?? "",
            accountingPercentage: savings?.accountingPercentage ?? 20,
            insurancePercentage: savings?.insurancePercentage ?? 10,
          }}
        />

        <PhoneAdmin initialProviders={phoneProviders} />

        <ElectricityAdmin initialProviders={electricityProviders} />
      </div>
    </div>
  );
}
