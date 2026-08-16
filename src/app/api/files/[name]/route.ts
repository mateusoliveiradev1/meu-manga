import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { IMAGE_EXT, safeUploadName } from "@/lib/uploads";
import { remoteUrlFor, storageMode } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const parsed = safeUploadName(name);
  if (!parsed) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Remote storage (R2): old rows still reference /api/files/<name> —
  // redirect to the public bucket URL so nothing breaks after migration.
  if (storageMode() === "r2") {
    const url = await remoteUrlFor(name);
    if (url) return NextResponse.redirect(url, 308);
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buf = fs.readFileSync(parsed.file);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": IMAGE_EXT[parsed.ext],
        // UUID names are immutable — safe to cache forever
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    // Cloudinary: imagens antigas ainda no disco (ou já migradas para o cloud)
    // — procura no Cloudinary antes de dar 404.
    if (storageMode() === "cloudinary") {
      const url = await remoteUrlFor(name);
      if (url) return NextResponse.redirect(url, 308);
    }
    return new NextResponse("Not found", { status: 404 });
  }
}
