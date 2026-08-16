import type { ImgHTMLAttributes } from "react";
import { COVER_WIDTHS, responsiveImageProps } from "@/lib/images";

type ResponsiveImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> & {
  src?: string | null;
  fallback?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
};

export function ResponsiveImage({
  src,
  fallback = "/samples/cover-farol.svg",
  width = 480,
  height = 640,
  sizes = "(max-width: 720px) 50vw, (max-width: 1200px) 25vw, 16vw",
  priority = false,
  alt = "",
  className,
  ...props
}: ResponsiveImageProps) {
  const image = responsiveImageProps(src || fallback, COVER_WIDTHS, sizes);
  return (
    <img
      {...props}
      {...image}
      className={["responsive-image", className].filter(Boolean).join(" ")}
      width={width}
      height={height}
      alt={alt}
      loading={priority ? "eager" : props.loading ?? "lazy"}
      fetchPriority={priority ? "high" : props.fetchPriority}
      decoding="async"
    />
  );
}
