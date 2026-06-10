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

export function getSiteHost(content: SiteContent): string {
  try {
    return new URL(getSiteUrl(content)).hostname;
  } catch {
    return "parovoz39.ru";
  }
}

export function getSeo(content: SiteContent) {
  const city = content.seo?.city?.trim() || "Калининград";
  const regionName = content.seo?.regionName?.trim() || "Калининградская область";
  const latitude = content.seo?.latitude?.trim() || "54.7104";
  const longitude = content.seo?.longitude?.trim() || "20.5101";

  const defaults = {
    siteUrl: "https://parovoz39.ru",
    metaTitle: `${content.title} — кальянная в ${city}`,
    metaDescription: `Кальянная ${content.title} в ${city}: ${content.address}. ${content.subtitle}. Меню кальянов и напитков, уютная атмосфера, онлайн-бронирование столиков.`,
    keywords: `кальянная ${city.toLowerCase()}, кальян ${city.toLowerCase()}, ${content.title.toLowerCase()}, кальянная артиллерийская, бронь столика, lounge bar`,
    ogImage: "",
    city,
    region: "RU-KGD",
    regionName,
    latitude,
    longitude,
    googleVerification: "",
    yandexVerification: "",
    indexNowKey: "parovoz39idx2026",
  };

  const merged = { ...defaults, ...content.seo };
  if (!merged.city?.trim()) merged.city = city;
  if (!merged.region?.trim()) merged.region = "RU-KGD";
  if (!merged.regionName?.trim()) merged.regionName = regionName;

  return merged;
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

  const verification: Metadata["verification"] = {};
  if (seo.googleVerification?.trim()) {
    verification.google = seo.googleVerification.trim();
  }
  if (seo.yandexVerification?.trim()) {
    verification.yandex = seo.yandexVerification.trim();
  }

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    keywords: seo.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    alternates: { canonical },
    authors: [{ name: content.title }],
    category: "Кальянная",
    verification: Object.keys(verification).length ? verification : undefined,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon", type: "image/png", sizes: "32x32" },
      ],
      apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
      shortcut: "/favicon.ico",
    },
    other: {
      "geo.region": seo.region,
      "geo.placename": seo.city,
      "geo.position": `${seo.latitude};${seo.longitude}`,
      ICBM: `${seo.latitude}, ${seo.longitude}`,
      "content-language": "ru",
    },
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
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" },
        },
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
    image: `${siteUrl}/opengraph-image`,
    address: {
      "@type": "PostalAddress",
      streetAddress: content.address,
      addressLocality: seo.city,
      addressRegion: seo.regionName,
      addressCountry: "RU",
    },
    areaServed: {
      "@type": "City",
      name: seo.city,
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: seo.regionName,
      },
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: Number(seo.latitude),
      longitude: Number(seo.longitude),
    },
    openingHoursSpecification,
    servesCuisine: "Кальянная",
    priceRange: "₽₽",
    sameAs: Object.values(content.social).filter((url) => url.trim()),
    ...(content.booking.enabled && {
      potentialAction: {
        "@type": "ReserveAction",
        target: `${siteUrl}/booking`,
        name: "Забронировать столик",
      },
    }),
  };
}

export function buildWebSiteJsonLd(content: SiteContent) {
  const siteUrl = getSiteUrl(content);
  const seo = getSeo(content);

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: content.title,
    description: seo.metaDescription,
    inLanguage: "ru-RU",
    publisher: { "@id": `${siteUrl}/#business` },
  };
}

export function buildFaqJsonLd(content: SiteContent) {
  const siteUrl = getSiteUrl(content);
  const seo = getSeo(content);

  const items = [
    {
      question: `Где находится кальянная ${content.title}?`,
      answer: `${content.title} — кальянная в ${seo.city} по адресу ${content.address}.`,
    },
    {
      question: "Можно ли забронировать столик онлайн?",
      answer: content.booking.enabled
        ? `Да, на сайте ${siteUrl}/booking доступно онлайн-бронирование столиков.`
        : "Уточняйте бронь по телефону.",
    },
    {
      question: `Как связаться с ${content.title}?`,
      answer: `Телефон: ${content.phone}.`,
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(
  content: SiteContent,
  items: { name: string; path: string }[],
) {
  const siteUrl = getSiteUrl(content);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}
