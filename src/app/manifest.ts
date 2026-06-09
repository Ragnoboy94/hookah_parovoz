import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";
import { getSeo, getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const content = await getContent();
  const seo = getSeo(content);
  const siteUrl = getSiteUrl(content);

  return {
    name: seo.metaTitle,
    short_name: content.title,
    description: seo.metaDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#080a08",
    theme_color: content.theme.primaryColor,
    lang: "ru",
    icons: [
      {
        src: `${siteUrl}/icon`,
        sizes: "32x32",
        type: "image/png",
      },
    ],
  };
}
