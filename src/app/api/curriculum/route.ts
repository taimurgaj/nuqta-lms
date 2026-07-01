import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject");
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const scope = searchParams.get("scope") ?? "global"; // "global" | "org"

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseFilter: any = {};
  if (subject) baseFilter.subject = subject;
  if (type) baseFilter.type = type;
  if (search) {
    baseFilter.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  // Global scope is public — no auth required
  if (scope === "global") {
    const items = await prisma.curriculumItem.findMany({
      where: { ...baseFilter, isPublic: true },
      include: { creator: { select: { name: true } } },
      orderBy: { downloads: "desc" },
    });
    return NextResponse.json(items);
  }

  // Org scope requires auth
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
  const user = session.user as { id: string; orgId?: string | null };

  if (scope === "org") {
    if (!user.orgId) return NextResponse.json([]);
    const items = await prisma.curriculumItem.findMany({
      where: { ...baseFilter, orgId: user.orgId, isPublic: false },
      include: { creator: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const user = session.user as { id: string; role: string; orgId?: string | null };
  if (user.role !== "teacher") return NextResponse.json({ error: "صرف اساتذہ مواد بنا سکتے ہیں" }, { status: 403 });

  const { title, description, subject, gradeLevel, type, content, isPublic, tags } = await req.json();
  if (!title || !subject || !content) {
    return NextResponse.json({ error: "عنوان، مضمون اور مواد ضروری ہے" }, { status: 400 });
  }

  const global = isPublic !== false;
  const item = await prisma.curriculumItem.create({
    data: {
      title, description, subject, gradeLevel,
      type: type || "lesson",
      content,
      isPublic: global,
      orgId: global ? null : (user.orgId ?? null),
      creatorId: user.id,
      tags: JSON.stringify(tags || []),
    },
  });

  return NextResponse.json(item, { status: 201 });
}
