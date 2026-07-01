import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateUrduJoinCode } from "@/lib/utils";

function toSlug(name: string): string {
  // Sanitize for URL use — keeps Unicode chars (Urdu), strips only control chars and slashes
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[/\\?#%]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export async function POST(req: NextRequest) {
  try {
    const { orgName, city, slug: rawSlug, adminName, adminEmail, adminPassword } = await req.json();

    if (!orgName || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: "تمام لازمی معلومات درکار ہیں" }, { status: 400 });
    }

    const slug = rawSlug ? toSlug(rawSlug) : toSlug(orgName);
    if (!slug) return NextResponse.json({ error: "شناختی نام درست نہیں ہے" }, { status: 400 });

    const [slugExists, emailExists] = await Promise.all([
      prisma.organization.findUnique({ where: { slug } }),
      prisma.user.findUnique({ where: { email: adminEmail } }),
    ]);

    if (slugExists) return NextResponse.json({ error: "یہ شناختی نام پہلے سے موجود ہے" }, { status: 409 });
    if (emailExists) return NextResponse.json({ error: "یہ برقی خط پہلے سے موجود ہے" }, { status: 409 });

    const joinCode = generateUrduJoinCode();
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const org = await prisma.organization.create({
      data: {
        name: orgName,
        slug,
        city: city || null,
        joinCode,
        users: {
          create: {
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: "teacher",
            isOrgAdmin: true,
          },
        },
      },
    });

    return NextResponse.json({ orgId: org.id, slug, joinCode, name: org.name }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "سرور میں خرابی" }, { status: 500 });
  }
}
