import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const API_URL = process.env.NUQTA_API_URL ?? "https://api.nuqta.dev";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const { code, language, stdin = "" } = await req.json();
  if (!code) return NextResponse.json({ error: "کوڈ ضروری ہے" }, { status: 400 });

  if (language === "html") {
    return NextResponse.json({ output: "HTML کوڈ کو نظارہ میں دیکھیں" });
  }

  if (language !== "urdu") {
    return NextResponse.json({ output: "اردو زبان کے علاوہ کوڈ چلانے کے لیے اڈا استعمال کریں" });
  }

  const inputs = stdin.trim() ? stdin.split("\n") : [];

  try {
    const res = await fetch(`${API_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, inputs, source: "edtech" }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "کوڈ چلانے میں خرابی" }, { status: 500 });
    }

    const data = await res.json();
    const output = data.stdout || data.stderr || "(کوئی نتیجہ نہیں)";
    return NextResponse.json({ output });
  } catch {
    return NextResponse.json({ error: "کوڈ چلانے میں خرابی" }, { status: 500 });
  }
}
