import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";
import { getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await getContent();
  const siteUrl = getSiteUrl(content);
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  if (content.booking.enabled) {
    pages.push({
      url: `${siteUrl}/booking`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return pages;
}
