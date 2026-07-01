import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
  const u = session.user as { id: string; isOrgAdmin?: boolean; orgId?: string };

  if (!u.isOrgAdmin) return NextResponse.json({ error: "صرف منتظم کے لیے" }, { status: 403 });

  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: "خفیہ رمز درکار ہے" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: u.id } });
  if (!user) return NextResponse.json({ error: "صارف نہیں ملا" }, { status: 404 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return NextResponse.json({ error: "خفیہ رمز غلط ہے" }, { status: 401 });

  const org = await prisma.organization.findUnique({
    where: { id: u.orgId ?? "" },
    select: { joinCode: true, name: true },
  });
  if (!org) return NextResponse.json({ error: "ادارہ نہیں ملا" }, { status: 404 });

  return NextResponse.json({ joinCode: org.joinCode, orgName: org.name });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
  return NextResponse.json(session.user);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
  const u = session.user as { id: string };

  const { name, currentPassword, newPassword } = await req.json();

  const user = await prisma.user.findUnique({ where: { id: u.id } });
  if (!user) return NextResponse.json({ error: "صارف نہیں ملا" }, { status: 404 });

  const updates: { name?: string; password?: string } = {};

  if (name && name.trim()) updates.name = name.trim();

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "موجودہ خفیہ رمز درکار ہے" }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "موجودہ خفیہ رمز غلط ہے" }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ error: "نیا خفیہ رمز کم از کم ۸ حروف کا ہونا چاہیے" }, { status: 400 });
    updates.password = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ message: "کوئی تبدیلی نہیں" });

  await prisma.user.update({ where: { id: u.id }, data: updates });
  return NextResponse.json({ message: "کامیابی سے تازہ کیا گیا" });
}
