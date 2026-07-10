import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredSandboxes, topUpPool } from "@/lib/demoSandbox";

// Belt-and-suspenders on top of the lazy sweep/top-up that already run
// around every /api/demo/spawn call — this only matters if nobody triggers a
// demo for a long stretch, so expired sandboxes and an empty pool would
// otherwise just sit there. Safe to call from anywhere (Vercel Cron, a
// GitHub Action, a manual curl) since it only ever deletes orgs whose
// expiresAt has already passed and only ever creates pool sandboxes up to
// the target size. Set DEMO_CLEANUP_SECRET to require a bearer token; leave
// unset to allow open access.
export async function POST(req: NextRequest) {
  const secret = process.env.DEMO_CLEANUP_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }
  }

  const deleted = await cleanupExpiredSandboxes();
  const created = await topUpPool();
  return NextResponse.json({ deleted, created });
}

export const GET = POST;
