import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateClassCode } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const user = session.user as { id: string; role: string };

  if (user.role === "teacher") {
    const classes = await prisma.class.findMany({
      where: { teacherId: user.id },
      include: {
        enrollments: { include: { student: { select: { id: true, name: true, email: true } } } },
        assignments: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(classes);
  } else {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id, isActive: true },
      include: {
        class: {
          include: {
            teacher: { select: { name: true } },
            assignments: { select: { id: true } },
          },
        },
      },
    });
    return NextResponse.json(enrollments.map((e) => e.class));
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (user.role !== "teacher") return NextResponse.json({ error: "صرف اساتذہ کلاسز بنا سکتے ہیں" }, { status: 403 });

  const { name, description, subject, gradeLevel, subAccountId } = await req.json();
  if (!name || !subject || !gradeLevel) {
    return NextResponse.json({ error: "نام، مضمون اور جماعت ضروری ہے" }, { status: 400 });
  }

  const code = generateClassCode();
  const cls = await prisma.class.create({
    data: { name, description, subject, gradeLevel, teacherId: user.id, code, subAccountId: subAccountId || null },
  });

  return NextResponse.json(cls, { status: 201 });
}
