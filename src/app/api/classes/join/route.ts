import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (user.role !== "student") return NextResponse.json({ error: "صرف طلبہ کلاس میں شامل ہو سکتے ہیں" }, { status: 403 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "کلاس کوڈ ضروری ہے" }, { status: 400 });

  const cls = await prisma.class.findUnique({ where: { code: code.toUpperCase() } });
  if (!cls) return NextResponse.json({ error: "کلاس نہیں ملی" }, { status: 404 });

  const existing = await prisma.enrollment.findUnique({
    where: { studentId_classId: { studentId: user.id, classId: cls.id } },
  });

  if (existing) {
    if (!existing.isActive) {
      await prisma.enrollment.update({ where: { id: existing.id }, data: { isActive: true } });
      return NextResponse.json({ message: "کلاس میں دوبارہ شامل ہو گئے" });
    }
    return NextResponse.json({ error: "آپ پہلے سے اس کلاس میں ہیں" }, { status: 409 });
  }

  await prisma.enrollment.create({ data: { studentId: user.id, classId: cls.id } });
  return NextResponse.json({ message: "کلاس میں شامل ہو گئے", className: cls.name });
}
