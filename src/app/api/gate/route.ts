import { NextRequest, NextResponse } from "next/server";
import { GATE_COOKIE, checkGatePassword, computeGateToken } from "@/lib/pilotGate";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!password || !(await checkGatePassword(password))) {
    return NextResponse.json({ error: "غلط رمز" }, { status: 401 });
  }

  const token = await computeGateToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GATE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
