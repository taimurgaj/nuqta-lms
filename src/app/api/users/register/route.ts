import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, joinCode } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "تمام فیلڈز ضروری ہیں" }, { status: 400 });
    }

    if (!joinCode) {
      return NextResponse.json({ error: "ادارے کا کوڈ ضروری ہے" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "یہ برقی خط پہلے سے موجود ہے" }, { status: 409 });
    }

    const normalizedCode = joinCode.trim();
    const org = await prisma.organization.findFirst({
      where: { OR: [{ joinCode: normalizedCode }, { joinCode: normalizedCode.toUpperCase() }] },
    });
    if (!org) return NextResponse.json({ error: "ادارے کا کوڈ غلط ہے" }, { status: 400 });
    const orgId = org.id;

    // Role is always student for self-registration; admins promote to teacher
    const assignedRole = "student";

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: assignedRole, orgId },
      select: { id: true, name: true, email: true, role: true, orgId: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "سرور میں خرابی" }, { status: 500 });
  }
}
