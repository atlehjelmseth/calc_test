import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DemoCalculator } from "@/components/demo/demo-calculator";

export default async function DemoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/calculator");

  let settings = { accountingPercentage: 20, insurancePercentage: 10 };
  try {
    const s = await db.savingsSettings.findFirst();
    if (s) {
      settings = {
        accountingPercentage: s.accountingPercentage,
        insurancePercentage: s.insurancePercentage,
      };
    }
  } catch {}

  return <DemoCalculator settings={settings} />;
}
