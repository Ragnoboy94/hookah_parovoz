import { ImageResponse } from "next/og";
import { getContent } from "@/lib/content";

export const dynamic = "force-dynamic";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const site = await getContent();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: site.theme.primaryColor,
          color: "white",
          fontSize: 20,
          fontWeight: 700,
          borderRadius: 8,
        }}
      >
        {site.title.charAt(0).toUpperCase()}
      </div>
    ),
    { ...size },
  );
}
