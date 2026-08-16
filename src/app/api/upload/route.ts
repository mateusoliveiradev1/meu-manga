import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/session";
import { saveImage } from "@/lib/storage";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_SIZE = 15 * 1024 * 1024; // 15MB

/**
 * Sniffs the real image type from the file's magic bytes — the client MIME
 * header is user-controlled and must not decide the extension or pass a
 * non-image through. Returns the extension or null if it isn't a known image.
 */
function sniffImageType(buf: Buffer): string | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length >= 6 && buf.subarray(0, 6).toString("latin1") === "GIF87a") return "gif";
  if (buf.length >= 6 && buf.subarray(0, 6).toString("latin1") === "GIF89a") return "gif";
  if (buf.length >= 12 && buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  if (buf.length >= 12 && buf.subarray(4, 8).toString("latin1") === "ftyp" && ["avif", "avis"].includes(buf.subarray(8, 12).toString("latin1"))) return "avif";
  return null;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const limited = await checkRateLimit({ key: `upload:user:${user.id}:1h`, limit: 120, windowSeconds: 3600 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Muitos uploads. Aguarde antes de tentar novamente." }, { status: 429 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie um arquivo de imagem." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Imagem grande demais (máx. 15 MB)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = sniffImageType(buffer);
  if (!ext) {
    return NextResponse.json({ error: "O arquivo não é uma imagem válida (PNG, JPG, WEBP, GIF ou AVIF)." }, { status: 400 });
  }

  const src = await saveImage(buffer, ext);
  return NextResponse.json({ src });
}
