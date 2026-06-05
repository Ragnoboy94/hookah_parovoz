import type { Metadata } from "next";
import type { SiteContent } from "./types";
import { formatScheduleLine, WEEKDAY_LABELS } from "./schedule";

const SCHEMA_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function getSiteUrl(content: SiteContent): string {
  const url =
    content.seo?.siteUrl?.trim() ||
    process.env.SITE_URL?.trim() ||
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function getSeo(content: SiteContent) {
  const defaults = {
    metaTitle: `${content.title} — кальянная`,
    metaDescription: `${content.subtitle}. ${content.address}. ${content.phone}`,
    keywords: `кальянная, кальян, ${content.title}, калининград`,
    ogImage: "",
  };

  return { ...defaults, ...content.seo };
}

export function buildPageMetadata(
  content: SiteContent,
  options?: {
    title?: string;
    description?: string;
    path?: string;
    noIndex?: boolean;
  },
): Metadata {
  const seo = getSeo(content);
  const siteUrl = getSiteUrl(content);
  const title = options?.title ?? seo.metaTitle;
  const description = options?.description ?? seo.metaDescription;
  const canonical = options?.path ? `${siteUrl}${options.path}` : siteUrl;
  const ogImage = seo.ogImage?.trim()
    ? seo.ogImage.startsWith("http")
      ? seo.ogImage
      : `${siteUrl}${seo.ogImage}`
    : `${siteUrl}/opengraph-image`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    keywords: seo.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url: canonical,
      siteName: content.title,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: content.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: options?.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

function formatSchemaTime(hour: number): string {
  const h = hour >= 24 ? hour - 24 : hour;
  return `${String(h).padStart(2, "0")}:00`;
}

export function buildLocalBusinessJsonLd(content: SiteContent) {
  const siteUrl = getSiteUrl(content);
  const seo = getSeo(content);
  const phone = content.phone.replace(/[^\d+]/g, "");

  const openingHoursSpecification = content.schedule.days.map((day, i) => {
    const line = formatScheduleLine(day);
    const [opens, closes] = line.split(" — ");
    return {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SCHEMA_DAYS[i] ?? WEEKDAY_LABELS[i],
      opens,
      closes,
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "BarOrPub"],
    "@id": `${siteUrl}/#business`,
    name: content.title,
    description: seo.metaDescription,
    url: siteUrl,
    telephone: phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: content.address,
      addressLocality: "Калининград",
      addressCountry: "RU",
    },
    openingHoursSpecification,
    servesCuisine: "Кальянная",
    priceRange: "₽₽",
    ...(content.booking.enabled && {
      potentialAction: {
        "@type": "ReserveAction",
        target: `${siteUrl}/booking`,
        name: "Забронировать столик",
      },
    }),
  };
}
