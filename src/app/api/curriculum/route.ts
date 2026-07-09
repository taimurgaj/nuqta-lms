import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// The curriculum is now a fixed catalog seeded from content/pilot-curriculum/*.mdx
// (see prisma/seed-curriculum.ts) — not authored by teachers. What a user can see
// depends on their org's tier: "demo" orgs get the 5 lessons that mirror
// learn.nuqta.dev; "pilot" orgs get the full 20.
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const user = session.user as { orgId?: string | null };
  let tier = "pilot";
  if (user.orgId) {
    const org = await prisma.organization.findUnique({ where: { id: user.orgId }, select: { tier: true } });
    tier = org?.tier ?? "pilot";
  }

  const items = await prisma.curriculumItem.findMany({
    where: tier === "demo" ? { tier: "demo" } : {},
    orderBy: { order: "asc" },
  });
  return NextResponse.json(items);
}

// Curriculum is seeded, not teacher-authored — see prisma/seed-curriculum.ts.
export async function POST() {
  return NextResponse.json(
    { error: "نصاب اب مقرر ہے اور صرف ایڈمن کی طرف سے شامل کیا جاتا ہے — اساتذہ نیا سبق نہیں بنا سکتے" },
    { status: 403 }
  );
}
