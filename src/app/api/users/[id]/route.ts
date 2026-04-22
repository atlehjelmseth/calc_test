import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateProfileSchema = z.object({
  type: z.literal("profile"),
  email: z.string().email("Ugyldig e-postadresse").optional(),
  name: z.string().max(100).optional(),
  role: z.enum(["ADMIN", "SELLER"]).optional(),
});

const updatePasswordSchema = z.object({
  type: z.literal("password"),
  password: z.string().min(6, "Passord må være minst 6 tegn"),
});

const updateSchema = z.discriminatedUnion("type", [
  updateProfileSchema,
  updatePasswordSchema,
]);

// PUT /api/users/[id] – oppdater bruker (kun admin)
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Ugyldig data" },
      { status: 400 }
    );
  }

  const target = await db.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Bruker ikke funnet" }, { status: 404 });

  if (parsed.data.type === "password") {
    const hashed = await bcrypt.hash(parsed.data.password, 12);
    await db.user.update({ where: { id }, data: { password: hashed } });
    return NextResponse.json({ success: true });
  }

  // Profile update
  const { email, name, role } = parsed.data;
  const updateData: Record<string, unknown> = {};

  if (name !== undefined) updateData.name = name || null;
  if (role !== undefined) updateData.role = role;

  if (email !== undefined) {
    const normalized = email.toLowerCase();
    if (normalized !== target.email) {
      const conflict = await db.user.findUnique({ where: { email: normalized } });
      if (conflict) {
        return NextResponse.json({ error: "E-postadressen er allerede i bruk" }, { status: 409 });
      }
    }
    updateData.email = normalized;
  }

  const user = await db.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json(user);
}

// DELETE /api/users/[id] – slett bruker (kun admin, ikke seg selv)
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });

  const { id } = await context.params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "Du kan ikke slette din egen konto" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Bruker ikke funnet" }, { status: 404 });

  await db.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
