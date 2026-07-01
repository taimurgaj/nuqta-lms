import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (user.role !== "teacher") return NextResponse.json({ error: "رسائی منع" }, { status: 403 });

  const { id } = await params;
  const { isPublished } = await req.json();
  const updated = await prisma.assignment.update({
    where: { id },
    data: { isPublished },
  });

  return NextResponse.json(updated);
}
