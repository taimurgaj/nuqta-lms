import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (user.role !== "teacher") return NextResponse.json({ error: "صرف اساتذہ گریڈ دے سکتے ہیں" }, { status: 403 });

  const { id } = await params;
  const { submissionId, grade, feedback } = await req.json();

  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, assignment: { id, class: { teacherId: user.id } } },
  });
  if (!submission) return NextResponse.json({ error: "جمع شدہ کام نہیں ملا" }, { status: 404 });

  const updated = await prisma.submission.update({
    where: { id: submissionId },
    data: { grade, feedback, status: "graded", gradedAt: new Date() },
  });

  return NextResponse.json(updated);
}
