import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (!q) return NextResponse.json({ orgs: [] });

  const orgs = await prisma.organization.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { slug: { contains: q.toLowerCase() } },
        { city: { contains: q } },
      ],
    },
    select: { id: true, name: true, slug: true, city: true },
    take: 8,
  });

  return NextResponse.json({ orgs });
}
