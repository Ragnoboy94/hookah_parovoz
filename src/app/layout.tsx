import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { getContent } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const meta = buildPageMetadata(content);
  return {
    ...meta,
    title: {
      default: content.seo?.metaTitle ?? `${content.title} — кальянная`,
      template: `%s — ${content.title}`,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
