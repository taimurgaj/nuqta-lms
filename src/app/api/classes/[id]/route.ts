import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { id } = await params;

  const isStudent = user.role === "student";

  if (isStudent) {
    const enrolled = await prisma.enrollment.findFirst({
      where: { classId: id, studentId: user.id, isActive: true },
    });
    if (!enrolled) return NextResponse.json({ error: "آپ اس جماعت میں داخل نہیں" }, { status: 403 });
  }

  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      teacher: { select: { name: true } },
      enrollments: {
        where: isStudent ? { studentId: user.id } : undefined,
        include: { student: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      assignments: {
        where: isStudent ? { isPublished: true } : undefined,
        include: {
          submissions: {
            where: isStudent ? { studentId: user.id } : undefined,
            include: { student: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cls) return NextResponse.json({ error: "کلاس نہیں ملی" }, { status: 404 });
  return NextResponse.json(cls);
}
