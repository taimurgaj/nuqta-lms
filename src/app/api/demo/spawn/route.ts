import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { encode } from "next-auth/jwt";
import { claimDemoSandbox, topUpPool } from "@/lib/demoSandbox";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days — matches NextAuth's default

export async function POST(req: NextRequest) {
  const { role } = await req.json().catch(() => ({}));
  if (role !== "teacher" && role !== "student") {
    return NextResponse.json({ error: "غلط کردار" }, { status: 400 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "سرور کنفیگریشن کی خرابی" }, { status: 500 });
  }

  try {
    const session = await claimDemoSandbox(role);

    // Mint the session cookie directly instead of asking the client to make a
    // second round trip through the credentials signIn() flow — we already
    // know this account is legitimate (we just built it), so re-verifying a
    // password we generated ourselves moments ago is pure wasted latency.
    // Shape mirrors exactly what authOptions' jwt() callback produces on a
    // normal login (see src/lib/auth.ts) so getToken()/useSession() elsewhere
    // in the app can't tell the difference.
    const token = await encode({
      secret,
      maxAge: SESSION_MAX_AGE,
      token: {
        name: session.name,
        email: session.email,
        sub: session.userId,
        id: session.userId,
        role: session.role,
        orgId: session.orgId,
        isOrgAdmin: session.isOrgAdmin,
        orgName: session.orgName,
        orgSlug: session.orgSlug,
        orgTier: session.orgTier,
      },
    });

    const secureCookie = req.nextUrl.protocol === "https:";
    const cookieName = `${secureCookie ? "__Secure-" : ""}next-auth.session-token`;

    const res = NextResponse.json({ ok: true, role: session.role });
    res.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    // Replenish the pool after responding, not before — the visitor
    // shouldn't wait on this.
    after(() => topUpPool().catch((e) => console.error("pool top-up failed:", e)));

    return res;
  } catch (e) {
    console.error("demo sandbox spawn failed:", e);
    return NextResponse.json({ error: "ڈیمو تیار نہیں ہو سکا، دوبارہ کوشش کریں" }, { status: 500 });
  }
}
