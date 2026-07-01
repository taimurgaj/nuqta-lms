import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as { orgId?: string | null } | null;
    const { pathname } = req.nextUrl;

    // These routes work without org membership
    const orgFreeRoutes = [
      "/student/ai-tutor",
      "/teacher/curriculum",
      "/settings",
    ];
    const isOrgFree = orgFreeRoutes.some((r) => pathname.startsWith(r));

    if (!isOrgFree && !token?.orgId) {
      return NextResponse.redirect(new URL("/library", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/teacher/:path*", "/student/:path*", "/settings/:path*", "/settings"],
};
