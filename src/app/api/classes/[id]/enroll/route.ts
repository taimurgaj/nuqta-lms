import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const u = session?.user as { isOrgAdmin?: boolean } | undefined;
  if (!u?.isOrgAdmin) return NextResponse.json({ error: "صرف منتظم طلبہ شامل کر سکتا ہے" }, { status: 403 });

  const { id } = await params;
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "صارف شناخت ضروری ہے" }, { status: 400 });

  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) return NextResponse.json({ error: "جماعت نہیں ملی" }, { status: 404 });

  try {
    const enrollment = await prisma.enrollment.create({
      data: { studentId: userId, classId: id },
      include: { student: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(enrollment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "یہ طالب علم پہلے سے شامل ہے" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const u = session?.user as { isOrgAdmin?: boolean } | undefined;
  if (!u?.isOrgAdmin) return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });

  const { id } = await params;
  const { userId } = await req.json();

  await prisma.enrollment.deleteMany({
    where: { classId: id, studentId: userId },
  });
  return NextResponse.json({ ok: true });
}
