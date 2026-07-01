import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { join } from "path";

const ALLOWED_MIME: Record<string, string[]> = {
  pdf:   ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  zip:   ["application/zip", "application/x-zip-compressed"],
  word:  ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  txt:   ["text/plain"],
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const allowed = JSON.parse((formData.get("allowedFileTypes") as string) || "[]") as string[];

  if (!file) return NextResponse.json({ error: "فائل نہیں ملی" }, { status: 400 });

  if (allowed.length > 0) {
    const fileExt = "." + (file.name.split(".").pop() ?? "").toLowerCase();
    const isAllowed = allowed.some((t) => {
      if (t.startsWith(".")) return fileExt === t.toLowerCase();
      return (ALLOWED_MIME[t] ?? []).includes(file.type);
    });
    if (!isAllowed) {
      return NextResponse.json({ error: "اس فائل کی قسم کی اجازت نہیں ہے" }, { status: 400 });
    }
  }

  const MAX_MB = 10;
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `فائل ${MAX_MB}MB سے بڑی نہیں ہونی چاہیے` }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await file.arrayBuffer();
  await writeFile(join(process.cwd(), "public", "uploads", filename), Buffer.from(bytes));

  return NextResponse.json({ url: `/uploads/${filename}`, name: file.name });
}
