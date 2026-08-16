/**
 * Camada de armazenamento de imagens.
 *
 * Três modos, em ordem de prioridade:
 *   1. Cloudinary (env CLOUDINARY_*) → upload no seu cloud, servido por CDN
 *   2. Cloudflare R2 (env R2_*)      → objetos no bucket, servidos pela URL pública
 *   3. Disco local (uploads/)        → padrão, servido por /api/files
 *
 * A troca é transparente: saveImage devolve a URL que deve ser gravada no
 * banco, e o site só usa essa URL.
 *
 * Por que nuvem: em hosts efêmeros (Vercel/Railway) o disco some a cada
 * deploy. Cloudinary é o mais simples de ligar (conta free, CDN + otimização);
 * R2 é S3-compatível e cobra ZERO de egress — ideal para escala, onde cada
 * leitura baixa dezenas de imagens.
 *
 * Env vars:
 *   Cloudinary (dashboard → Settings → Access Keys):
 *     CLOUDINARY_CLOUD_NAME  nome do cloud
 *     CLOUDINARY_API_KEY     chave de API
 *     CLOUDINARY_API_SECRET  segredo da API
 *   R2:
 *     R2_BUCKET_NAME        nome do bucket (ex.: mangas)
 *     R2_PUBLIC_URL         URL pública do bucket (ex.: https://pub-xxx.r2.dev)
 *     R2_ENDPOINT           endpoint S3 (https://<ACCOUNT_ID>.r2.cloudflarestorage.com)
 *     R2_ACCESS_KEY_ID      token de acesso
 *     R2_SECRET_ACCESS_KEY  segredo do token
 */
import { v2 as cloudinary } from "cloudinary";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { IMAGE_EXT, UPLOAD_DIR } from "@/lib/uploads";

function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  );
}

if (cloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function r2Config(): { bucket: string; publicUrl: string; client: S3Client } | null {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!bucket || !publicUrl || !endpoint || !accessKeyId || !secretAccessKey) return null;
  return {
    bucket,
    publicUrl,
    client: new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey } }),
  };
}

export type StorageMode = "local" | "r2" | "cloudinary";

export function storageMode(): StorageMode {
  if (cloudinaryConfigured()) return "cloudinary";
  if (r2Config()) return "r2";
  return "local";
}

/**
 * Otimiza a imagem antes de salvar: converte PNG/JPG/GIF para WebP (q. 82) e
 * corrige a orientação EXIF. WebP já fica como está. Páginas de mangá ficam
 * bem menores no tráfego (mobile agradece) sem perda visível.
 */
async function optimizeImage(buffer: Buffer, ext: string): Promise<{ buffer: Buffer; ext: string }> {
  if (ext === "webp" || ext === "avif") return { buffer, ext };
  try {
    const out = await sharp(buffer, { failOn: "none" }).rotate().webp({ quality: 82 }).toBuffer();
    return { buffer: out, ext: "webp" };
  } catch {
    return { buffer, ext };
  }
}

/** Persiste uma imagem e devolve a URL pública para gravar no banco. */
export async function saveImage(buffer: Buffer, ext: string, publicId?: string): Promise<string> {
  const optimized = await optimizeImage(buffer, ext);
  buffer = optimized.buffer;
  ext = optimized.ext;

  if (storageMode() === "cloudinary") {
    // O SDK aceita Buffer em runtime, mas os tipos só expõem string — data URI
    // é o caminho documentado e tipado para enviar bytes em memória.
    const dataUri = `data:${IMAGE_EXT[ext]};base64,${buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "mangas",
      public_id: publicId ?? crypto.randomUUID(),
      overwrite: true,
      resource_type: "image",
    });
    return result.secure_url;
  }

  const r2 = r2Config();
  if (r2) {
    const key = `mangas/${crypto.randomUUID()}.${ext}`;
    await r2.client.send(
      new PutObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        Body: buffer,
        ContentType: IMAGE_EXT[ext],
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    return `${r2.publicUrl}/${key}`;
  }

  const name = `${crypto.randomUUID()}.${ext}`;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(/* turbopackIgnore: true */ UPLOAD_DIR, name), buffer);
  return `/api/files/${name}`;
}

/**
 * Se o arquivo existe no armazenamento remoto, devolve a URL pública
 * (senão null). Usado pelo /api/files para redirecionar capas antigas que
 * ainda apontam para /api/files/<nome> após a migração para a nuvem.
 */
export async function remoteUrlFor(name: string): Promise<string | null> {
  if (storageMode() === "cloudinary") {
    // public_id do Cloudinary é "mangas/<uuid>" (sem extensão)
    const publicId = `mangas/${name.replace(/\.[^.]+$/, "")}`;
    try {
      const res = await cloudinary.api.resource(publicId);
      return res.secure_url ?? null;
    } catch {
      return null;
    }
  }
  const r2 = r2Config();
  if (!r2) return null;
  try {
    await r2.client.send(new HeadObjectCommand({ Bucket: r2.bucket, Key: `mangas/${name}` }));
    return `${r2.publicUrl}/mangas/${name}`;
  } catch {
    return null;
  }
}
