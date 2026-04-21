import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createPlanSchema = z.object({
  providerId: z.string().min(1),
  name: z.string().min(1).max(100),
  fixedAmount: z.number().min(0),
  markup: z.number().min(0),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ugyldig data", details: parsed.error.flatten() }, { status: 400 });
  }

  const lastPlan = await db.electricityPlan.findFirst({
    where: { providerId: parsed.data.providerId },
    orderBy: { sortOrder: "desc" },
  });
  const sortOrder = (lastPlan?.sortOrder ?? -1) + 1;

  const plan = await db.electricityPlan.create({
    data: { ...parsed.data, sortOrder },
  });

  return NextResponse.json(plan, { status: 201 });
}
