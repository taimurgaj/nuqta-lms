import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  if (user.role === "teacher") {
    const where = classId ? { classId, class: { teacherId: user.id } } : { class: { teacherId: user.id } };
    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        class: { select: { name: true } },
        submissions: { select: { id: true, grade: true, status: true, content: true, fileUrl: true, feedback: true, submittedAt: true, student: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(assignments);
  } else {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id, isActive: true },
      select: { classId: true },
    });
    const classIds = enrollments.map((e) => e.classId);
    if (classIds.length === 0) return NextResponse.json([]);
    const assignments = await prisma.assignment.findMany({
      where: { classId: { in: classIds }, isPublished: true },
      include: {
        class: { select: { name: true } },
        submissions: { where: { studentId: user.id }, select: { grade: true, status: true, submittedAt: true, fileUrl: true, feedback: true, content: true } },
      },
      orderBy: { dueDate: "asc" },
    });
    return NextResponse.json(assignments);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (user.role !== "teacher") return NextResponse.json({ error: "صرف اساتذہ اسائنمنٹ بنا سکتے ہیں" }, { status: 403 });

  const { title, description, classId, dueDate, maxPoints, type, isPublished, allowedFileTypes } = await req.json();
  if (!title || !description || !classId) {
    return NextResponse.json({ error: "عنوان، تفصیل اور کلاس ضروری ہے" }, { status: 400 });
  }

  const cls = await prisma.class.findFirst({ where: { id: classId, teacherId: user.id } });
  if (!cls) return NextResponse.json({ error: "کلاس نہیں ملی" }, { status: 404 });

  const assignment = await prisma.assignment.create({
    data: {
      title, description, classId, creatorId: user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      maxPoints: maxPoints || 100,
      type: type || "written",
      isPublished: isPublished || false,
      allowedFileTypes: JSON.stringify(allowedFileTypes ?? []),
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}
