import { NextResponse } from "next/server";
import { spawnSync } from "child_process";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  const extensionDir = path.resolve(process.cwd(), "../../extension");
  const result = spawnSync(
    "zip",
    ["-r", "-", ".", "-x", "*.env", "-x", ".env.*", "-x", ".DS_Store", "-x", "*.log"],
    { cwd: extensionDir, encoding: "buffer" }
  );

  if (result.status !== 0 || result.error) {
    console.error("[extension-download] zip failed:", result.error ?? result.stderr?.toString());
    return NextResponse.json({ error: "Failed to package extension." }, { status: 500 });
  }

  return new NextResponse(result.stdout, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="guardian-wallet-extension.zip"'
    }
  });
}
