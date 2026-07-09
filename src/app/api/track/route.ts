import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { event_name, path, metadata } = await req.json();
    if (!event_name) return NextResponse.json({ error: "event_name required" }, { status: 400 });

    const metadataJson = metadata ? JSON.stringify(metadata) : null;
    await prisma.$executeRaw`
      insert into events (event_name, source_app, path, metadata)
      values (${event_name}, 'edtech', ${path ?? null}, ${metadataJson}::jsonb)
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("edtech track route error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
