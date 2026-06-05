import { ImageResponse } from "next/og";
import { getContent } from "@/lib/content";

export const dynamic = "force-dynamic";
export const alt = "Паровоз — кальянная";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const site = await getContent();
  const color = site.theme.primaryColor;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#080a08",
          color: "#f0f2ee",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 200,
            background: `radial-gradient(ellipse at center, ${color}55, transparent)`,
          }}
        />
        <div style={{ fontSize: 28, letterSpacing: 8, opacity: 0.6, marginBottom: 16 }}>
          КАЛЬЯННАЯ
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, marginBottom: 24 }}>
          {site.title}
        </div>
        <div style={{ fontSize: 32, opacity: 0.8 }}>{site.subtitle}</div>
        <div style={{ fontSize: 24, marginTop: 32, color: color }}>
          {site.address}
        </div>
      </div>
    ),
    { ...size },
  );
}
