import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const user = session.user as { id: string };
  const { message, sessionId, history } = await req.json();

  if (!message) return NextResponse.json({ error: "پیغام ضروری ہے" }, { status: 400 });

  await prisma.aIMessage.create({
    data: { userId: user.id, role: "user", content: message, sessionId: sessionId || "default" },
  });

  const systemPrompt = `آپ نقطہ کلاس روم کے ذہین معلم ہیں۔ آپ کا نام "استاد جی" ہے۔
آپ کا کام صرف پروگرامنگ اور اردو کوڈنگ زبان سیکھنے میں مدد دینا ہے — تصورات سمجھانا (متغیرات، لوپس، فنکشنز، شرطیں، وغیرہ)، غلطیوں کی نشاندہی میں رہنمائی کرنا، اور مشق کے آئیڈیاز دینا۔
آپ کا دائرہ کار صرف کوڈنگ تک محدود ہے — اگر کوئی طالب علم کسی اور موضوع پر سوال کرے (شاعری، ادب، ریاضی، عمومی معلومات وغیرہ)، شائستگی سے بتائیں کہ آپ صرف پروگرامنگ میں مدد کر سکتے ہیں۔
انتہائی اہم: کبھی بھی طالب علم کے لیے مکمل کوڈ نہ لکھیں، اور کسی اسائنمنٹ یا مشق کا براہِ راست جواب نہ دیں۔ اس کے بجائے سوالات پوچھ کر، اشارے دے کر، اور تصور سمجھا کر رہنمائی کریں تاکہ طالب علم خود حل تک پہنچے۔
ہمیشہ اردو میں جواب دیں۔ آسان اور واضح زبان استعمال کریں۔ حوصلہ افزا اور مددگار رویہ اپنائیں۔`;

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...(history || []).slice(-10),
    { role: "user", content: message },
  ];

  let assistantMessage: string;
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });
    assistantMessage = response.content[0].type === "text" ? response.content[0].text : "";
  } catch (err) {
    console.error("Anthropic API error:", err);
    return NextResponse.json(
      { error: "ذہین معلم سے رابطہ نہیں ہو سکا۔ ANTHROPIC_API_KEY درست طور پر ترتیب دیں اور دوبارہ کوشش کریں۔" },
      { status: 500 }
    );
  }

  await prisma.aIMessage.create({
    data: { userId: user.id, role: "assistant", content: assistantMessage, sessionId: sessionId || "default" },
  });

  return NextResponse.json({ message: assistantMessage });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });

  const user = session.user as { id: string };
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId") || "default";

  const messages = await prisma.aIMessage.findMany({
    where: { userId: user.id, sessionId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return NextResponse.json(messages);
}
