import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";
import { getSiteHost, getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const content = await getContent();
  const siteUrl = getSiteUrl(content);
  const host = getSiteHost(content);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
      {
        userAgent: "Yandex",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host,
  };
}
