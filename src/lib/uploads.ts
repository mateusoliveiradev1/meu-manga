import path from "node:path";

/**
 * Uploads live OUTSIDE public/ and are served through /api/files/[name].
 * Rationale: the production server snapshots the public/ directory at boot,
 * so freshly uploaded files would 404 until restart — and user content
 * shouldn't sit in the statically-served tree anyway.
 */

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export const IMAGE_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

/** Uploaded files are UUID-named; anything else is rejected (anti traversal). */
const NAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|gif|avif)$/i;

export function safeUploadName(name: string): { file: string; ext: string } | null {
  if (!NAME_RE.test(name)) return null;
  const ext = name.split(".").pop()!.toLowerCase();
  const file = path.join(UPLOAD_DIR, name);
  // belt and suspenders: resolve and confirm it stays inside the upload dir
  if (!path.resolve(file).startsWith(path.resolve(UPLOAD_DIR) + path.sep)) return null;
  return { file, ext };
}
