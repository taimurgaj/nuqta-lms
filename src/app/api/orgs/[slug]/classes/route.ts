import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateClassCode } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  const u = session?.user as { isOrgAdmin?: boolean; orgSlug?: string } | undefined;
  const { slug } = await params;

  if (!u?.isOrgAdmin || u.orgSlug !== slug)
    return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) return NextResponse.json({ error: "ادارہ نہیں ملا" }, { status: 404 });

  const classes = await prisma.class.findMany({
    where: { orgId: org.id },
    include: {
      teacher: { select: { id: true, name: true } },
      enrollments: {
        where: { isActive: true },
        include: { student: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(classes);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  const u = session?.user as { isOrgAdmin?: boolean; orgSlug?: string } | undefined;
  const { slug } = await params;

  if (!u?.isOrgAdmin || u.orgSlug !== slug)
    return NextResponse.json({ error: "صرف منتظم اسباق بنا سکتا ہے" }, { status: 403 });

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) return NextResponse.json({ error: "ادارہ نہیں ملا" }, { status: 404 });

  const { name, description, subject, gradeLevel, teacherId } = await req.json();
  if (!name || !gradeLevel || !teacherId)
    return NextResponse.json({ error: "نام، جماعت اور استاد ضروری ہیں" }, { status: 400 });

  const code = generateClassCode();
  const cls = await prisma.class.create({
    data: {
      name,
      description: description || null,
      subject: subject || null,
      gradeLevel,
      teacherId,
      orgId: org.id,
      code,
    },
    include: {
      teacher: { select: { id: true, name: true } },
      enrollments: { include: { student: { select: { id: true, name: true, email: true } } } },
    },
  });

  return NextResponse.json(cls, { status: 201 });
}
