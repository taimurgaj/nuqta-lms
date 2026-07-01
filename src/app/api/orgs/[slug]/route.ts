import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, city: true, createdAt: true },
  });
  if (!org) return NextResponse.json({ error: "ادارہ نہیں ملا" }, { status: 404 });
  return NextResponse.json(org);
}
