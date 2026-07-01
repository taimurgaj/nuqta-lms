import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  const u = session?.user as { isOrgAdmin?: boolean; orgSlug?: string } | undefined;
  const { slug } = await params;
  if (!u?.isOrgAdmin || u.orgSlug !== slug) {
    return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) return NextResponse.json({ error: "ادارہ نہیں ملا" }, { status: 404 });

  const members = await prisma.user.findMany({
    where: { orgId: org.id },
    select: { id: true, name: true, email: true, role: true, isOrgAdmin: true, createdAt: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(members);
}
