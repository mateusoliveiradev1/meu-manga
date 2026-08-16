import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 };
export const SOCIAL_IMAGE_ALT = `${SITE_NAME} — leia mangás online`;

function BrandMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path fill="#f5c518" d="M8 8h29c6.1 0 11 4.9 11 11v23c0 6.1-4.9 11-11 11H23L12 61v-8H8C3.6 53 0 49.4 0 45V16C0 11.6 3.6 8 8 8Z" />
      <path fill="#0a0a0f" d="M24 18c1.8 7.1 5.2 10.5 12 12-6.8 1.5-10.2 4.9-12 12-1.8-7.1-5.2-10.5-12-12 6.8-1.5 10.2-4.9 12-12Z" />
      <path fill="#f5c518" d="M51 14h3.5v32H51zM57.5 18H61v24h-3.5z" />
    </svg>
  );
}

export function createSocialImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#0a0a0f",
          color: "#ecebe6",
          padding: "74px 82px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -95,
            top: -120,
            width: 430,
            height: 430,
            borderRadius: 215,
            background: "#121218",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 58, position: "relative" }}>
          <div
            style={{
              width: 190,
              height: 190,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#121218",
              border: "1px solid #262630",
              borderRadius: 36,
            }}
          >
            <BrandMark size={142} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
            <div style={{ fontSize: 88, fontWeight: 900, letterSpacing: -2, lineHeight: 1, textTransform: "uppercase" }}>
              {SITE_NAME}
            </div>
            <div style={{ marginTop: 28, color: "#a2a0ab", fontSize: 30, lineHeight: 1.35 }}>
              {SITE_DESCRIPTION}
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 12,
            display: "flex",
            background: "#f5c518",
          }}
        />
      </div>
    ),
    SOCIAL_IMAGE_SIZE,
  );
}
