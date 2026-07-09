import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { GATE_COOKIE, isGateCookieValid } from "@/lib/pilotGate";

// Paths that must work with zero password, since they're what the public
// nuqta.dev "test run" links point at (or are needed to even reach them):
// the marketing homepage with the demo-login buttons, and NextAuth's own
// internal callback/session/csrf endpoints those buttons call.
const GATE_EXEMPT_EXACT = new Set(["/", "/gate"]);
const GATE_EXEMPT_PREFIXES = ["/api/gate", "/api/auth", "/_next", "/favicon.ico"];

const PROTECTED_PREFIXES = ["/teacher", "/student", "/settings"];
const ORG_FREE_ROUTES = ["/student/ai-tutor", "/teacher/curriculum", "/settings"];

function isExempt(pathname: string): boolean {
  if (GATE_EXEMPT_EXACT.has(pathname)) return true;
  return GATE_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isExempt(pathname)) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const orgTier = (token as { orgTier?: string } | null)?.orgTier;

  // Demo-tier sessions (the test-run login) always bypass the pilot gate —
  // this is what keeps the nuqta.dev "try it" flow password-free while
  // everything else (real orgs, registration, dashboards, APIs) is gated.
  if (orgTier !== "demo") {
    const gateCookie = req.cookies.get(GATE_COOKIE)?.value;
    if (!(await isGateCookieValid(gateCookie))) {
      const gateUrl = new URL("/gate", req.url);
      gateUrl.searchParams.set("next", pathname + req.nextUrl.search);
      return NextResponse.redirect(gateUrl);
    }
  }

  // Existing auth/org-membership protection for dashboard routes, now
  // running after the gate check rather than via next-auth/middleware's
  // withAuth (which would redirect pre-auth routes like /orgs/register to
  // /login before this gate logic ever ran).
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const isOrgFree = ORG_FREE_ROUTES.some((r) => pathname.startsWith(r));
    if (!isOrgFree && !(token as { orgId?: string | null }).orgId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except static assets — the gate has to see
  // registration pages and API routes too, not just the dashboard.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
