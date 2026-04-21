import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// GET /api/phone-providers – alle leverandører med abonnementer (alle innloggede)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }

  const providers = await db.phoneProvider.findMany({
    where: { active: true },
    include: {
      plans: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(providers);
}

const createProviderSchema = z.object({
  name: z.string().min(1).max(100),
  isOurOffer: z.boolean().optional().default(false),
});

// POST /api/phone-providers – opprett ny leverandør (admin)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createProviderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ugyldig data" }, { status: 400 });
  }

  const lastProvider = await db.phoneProvider.findFirst({ orderBy: { sortOrder: "desc" } });
  const sortOrder = (lastProvider?.sortOrder ?? -1) + 1;

  const provider = await db.phoneProvider.create({
    data: { ...parsed.data, sortOrder },
    include: { plans: true },
  });

  return NextResponse.json(provider, { status: 201 });
}
