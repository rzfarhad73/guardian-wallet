import { NextResponse } from "next/server";
import { getQvacStatus } from "@/lib/qvac/qvacClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { status: getQvacStatus() },
    { headers: { "Cache-Control": "public, max-age=4, stale-while-revalidate=10" } }
  );
}
