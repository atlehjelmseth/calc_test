import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }

  try {
    const savings = await db.savingsSettings.findFirst();
    return NextResponse.json({ savings });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente innstillinger" },
      { status: 500 }
    );
  }
}

const savingsSchema = z.object({
  type: z.literal("savings"),
  accountingPercentage: z.number().min(0).max(100),
  insurancePercentage: z.number().min(0).max(100),
});

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const parsed = savingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ugyldig data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const existing = await db.savingsSettings.findFirst();
    if (existing) {
      await db.savingsSettings.update({
        where: { id: existing.id },
        data: {
          accountingPercentage: parsed.data.accountingPercentage,
          insurancePercentage: parsed.data.insurancePercentage,
        },
      });
    } else {
      await db.savingsSettings.create({
        data: {
          accountingPercentage: parsed.data.accountingPercentage,
          insurancePercentage: parsed.data.insurancePercentage,
        },
      });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke lagre innstillinger" },
      { status: 500 }
    );
  }
}
