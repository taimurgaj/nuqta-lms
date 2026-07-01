import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string; userId: string }> }) {
  const session = await getServerSession(authOptions);
  const u = session?.user as { isOrgAdmin?: boolean; orgSlug?: string } | undefined;
  const { slug, userId } = await params;

  if (!u?.isOrgAdmin || u.orgSlug !== slug)
    return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });

  const body = await req.json();

  if (body.password !== undefined) {
    if (!body.password || body.password.length < 4)
      return NextResponse.json({ error: "خفیہ رمز کم از کم ۴ حروف کا ہونا چاہیے" }, { status: 400 });
    const hashed = await bcrypt.hash(body.password, 10);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
      select: { id: true, name: true, email: true, role: true, isOrgAdmin: true },
    });
    return NextResponse.json(updated);
  }

  const { role } = body;
  if (!["teacher", "student"].includes(role))
    return NextResponse.json({ error: "غلط کردار" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true, isOrgAdmin: true },
  });

  return NextResponse.json(updated);
}
