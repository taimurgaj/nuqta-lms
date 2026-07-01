import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (user.role !== "student") return NextResponse.json({ error: "صرف طلبہ جمع کر سکتے ہیں" }, { status: 403 });

  const { id } = await params;
  const { content, fileUrl } = await req.json();

  if (!content && !fileUrl) {
    return NextResponse.json({ error: "جواب یا فائل ضروری ہے" }, { status: 400 });
  }

  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) return NextResponse.json({ error: "اسائنمنٹ نہیں ملی" }, { status: 404 });

  const isLate = assignment.dueDate ? new Date() > assignment.dueDate : false;

  const submission = await prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId: id, studentId: user.id } },
    update: { content: content ?? "", fileUrl: fileUrl ?? null, status: isLate ? "late" : "submitted", submittedAt: new Date() },
    create: {
      assignmentId: id,
      studentId: user.id,
      content: content ?? "",
      fileUrl: fileUrl ?? null,
      status: isLate ? "late" : "submitted",
    },
  });

  return NextResponse.json(submission);
}
