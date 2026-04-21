import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  dataGB: z.number().int().min(-1).optional(),
  pricePerSub: z.number().min(0).optional(),
  active: z.boolean().optional(),
});

// PUT /api/phone-plans/[id] – oppdater abonnement (admin)
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ugyldig data" }, { status: 400 });

  const plan = await db.phonePlan.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(plan);
}

// DELETE /api/phone-plans/[id] – slett abonnement (admin)
export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });

  const { id } = await context.params;
  await db.phonePlan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
