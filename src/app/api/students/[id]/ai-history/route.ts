import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (user.role !== "teacher") return NextResponse.json({ error: "صرف اساتذہ دیکھ سکتے ہیں" }, { status: 403 });

  const { id: studentId } = await params;

  // Only allow viewing history for a student actually enrolled in one of this teacher's classes
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, class: { teacherId: user.id } },
  });
  if (!enrollment) return NextResponse.json({ error: "یہ طالب علم آپ کی کسی جماعت میں نہیں" }, { status: 403 });

  const messages = await prisma.aIMessage.findMany({
    where: { userId: studentId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}
