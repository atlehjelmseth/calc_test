import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isOurOffer: z.boolean().optional(),
  active: z.boolean().optional(),
});

// PUT /api/phone-providers/[id] – oppdater leverandør (admin)
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ugyldig data" }, { status: 400 });

  const provider = await db.phoneProvider.update({
    where: { id },
    data: parsed.data,
    include: { plans: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(provider);
}

// DELETE /api/phone-providers/[id] – slett leverandør (admin, cascade sletter planer)
export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });

  const { id } = await context.params;
  await db.phoneProvider.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
