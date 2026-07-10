import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await prisma.organization.findUnique({
    where: { slug },
    include: {
      subAccounts: {
        orderBy: { createdAt: "asc" },
        include: { children: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
  if (!org) return NextResponse.json({ error: "ادارہ نہیں ملا" }, { status: 404 });
  // Return only top-level sub-accounts (no parent)
  const topLevel = org.subAccounts.filter((s) => !s.parentId);
  return NextResponse.json(topLevel);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  const u = session?.user as { isOrgAdmin?: boolean; orgSlug?: string } | undefined;
  const { slug } = await params;
  if (!u?.isOrgAdmin || u.orgSlug !== slug) {
    return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) return NextResponse.json({ error: "ادارہ نہیں ملا" }, { status: 404 });

  const { name, type, parentId } = await req.json();
  if (!name || !type) return NextResponse.json({ error: "نام اور قسم ضروری ہے" }, { status: 400 });

  const subAccount = await prisma.subAccount.create({
    data: { orgId: org.id, name, type, parentId: parentId || null },
  });
  return NextResponse.json(subAccount, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  const u = session?.user as { isOrgAdmin?: boolean; orgSlug?: string } | undefined;
  const { slug } = await params;
  if (!u?.isOrgAdmin || u.orgSlug !== slug) {
    return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });
  }

  const { id } = await req.json();
  await prisma.subAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
