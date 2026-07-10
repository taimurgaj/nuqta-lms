import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function guard(slug: string) {
  const session = await getServerSession(authOptions);
  const u = session?.user as { isOrgAdmin?: boolean; orgSlug?: string } | undefined;
  if (!u?.isOrgAdmin || u.orgSlug !== slug) return null;
  const org = await prisma.organization.findUnique({ where: { slug } });
  return org;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const org = await prisma.organization.findUnique({ where: { slug } });
    if (!org) return NextResponse.json({ error: "ادارہ نہیں ملا" }, { status: 404 });

    const jamaats = await prisma.jamaat.findMany({
      where: { orgId: org.id },
      include: {
        classes: {
          include: { teacher: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(jamaats);
  } catch (e) {
    console.error("jamaats GET error:", e);
    return NextResponse.json({ error: "سرور میں خرابی" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await guard(slug);
  if (!org) return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "نام ضروری ہے" }, { status: 400 });

  const jamaat = await prisma.jamaat.create({
    data: { orgId: org.id, name: name.trim() },
    include: { classes: { include: { teacher: { select: { id: true, name: true } } } } },
  });
  return NextResponse.json(jamaat, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await guard(slug);
  if (!org) return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });

  const { classId, jamaatId } = await req.json();
  if (!classId) return NextResponse.json({ error: "سبق کا شناخت کنندہ ضروری ہے" }, { status: 400 });

  const updated = await prisma.class.update({
    where: { id: classId },
    data: { jamaatId: jamaatId ?? null },
    include: { teacher: { select: { id: true, name: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await guard(slug);
  if (!org) return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });

  const { id } = await req.json();
  // Unlink all classes first
  await prisma.class.updateMany({ where: { jamaatId: id }, data: { jamaatId: null } });
  await prisma.jamaat.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
