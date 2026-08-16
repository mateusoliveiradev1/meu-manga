const CLOUDINARY_UPLOAD = "/image/upload/";

export function cloudinaryImageUrl(src: string, width: number, quality = "auto:good"): string {
  if (!src.includes("res.cloudinary.com") || !src.includes(CLOUDINARY_UPLOAD)) return src;
  const [base, asset] = src.split(CLOUDINARY_UPLOAD, 2);
  if (!asset) return src;
  return `${base}${CLOUDINARY_UPLOAD}f_auto,q_${quality},c_limit,w_${width}/${asset}`;
}

export function responsiveImageProps(src: string, widths: number[], sizes: string) {
  const normalized = [...new Set(widths)].sort((a, b) => a - b);
  const transformed = src.includes("res.cloudinary.com") && src.includes(CLOUDINARY_UPLOAD);
  if (!transformed) return { src, sizes };
  const largest = normalized[normalized.length - 1] ?? 1280;
  return {
    src: cloudinaryImageUrl(src, largest),
    srcSet: normalized.map((width) => `${cloudinaryImageUrl(src, width)} ${width}w`).join(", "),
    sizes,
  };
}

export const COVER_WIDTHS = [180, 280, 420, 640, 800];
export const READER_WIDTHS = [640, 960, 1280, 1600, 2048];
