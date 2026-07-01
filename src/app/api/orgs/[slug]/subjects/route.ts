import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) return NextResponse.json({ error: "ادارہ نہیں ملا" }, { status: 404 });

  const subjects = await prisma.subject.findMany({
    where: { orgId: org.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(subjects);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  const u = session?.user as { isOrgAdmin?: boolean; orgSlug?: string } | undefined;
  const { slug } = await params;

  if (!u?.isOrgAdmin || u.orgSlug !== slug)
    return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) return NextResponse.json({ error: "ادارہ نہیں ملا" }, { status: 404 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "مضمون کا نام ضروری ہے" }, { status: 400 });

  try {
    const subject = await prisma.subject.create({
      data: { orgId: org.id, name: name.trim() },
    });
    return NextResponse.json(subject, { status: 201 });
  } catch {
    return NextResponse.json({ error: "یہ مضمون پہلے سے موجود ہے" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  const u = session?.user as { isOrgAdmin?: boolean; orgSlug?: string } | undefined;
  const { slug } = await params;

  if (!u?.isOrgAdmin || u.orgSlug !== slug)
    return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });

  const { id } = await req.json();
  await prisma.subject.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
