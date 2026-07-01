import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const user = session.user as { id: string };
  const { id } = await params;

  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      teacher: { select: { name: true } },
      assignments: {
        where: { isPublished: true },
        include: {
          submissions: {
            where: { studentId: user.id },
            select: { grade: true, status: true, submittedAt: true, feedback: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cls) return NextResponse.json({ error: "کورس نہیں ملا" }, { status: 404 });
  return NextResponse.json(cls);
}
