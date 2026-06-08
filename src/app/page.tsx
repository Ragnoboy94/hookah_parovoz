import { AgeNotice } from "@/components/landing/AgeNotice";
import { JsonLd } from "@/components/landing/JsonLd";
import { Contact } from "@/components/landing/Contact";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Menu } from "@/components/landing/Menu";
import { ThemeProvider } from "@/components/landing/ThemeProvider";
import { YandexMetrika } from "@/components/landing/YandexMetrika";
import { getContent } from "@/lib/content";
import { getOpenStatus } from "@/lib/schedule";
import { buildLocalBusinessJsonLd, buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const content = await getContent();
  return buildPageMetadata(content, { path: "/" });
}

export default async function HomePage() {
  const content = await getContent();
  const status = getOpenStatus(content);
  const jsonLd = buildLocalBusinessJsonLd(content);

  return (
    <ThemeProvider content={content}>
      <JsonLd data={jsonLd} />
      <main className="site-bg min-h-screen">
        <Hero content={content} status={status} />
        <AgeNotice text={content.legal.ageRestriction} />
        <Menu content={content} />
        <Contact content={content} />
        <Footer content={content} />
      </main>
      <YandexMetrika id={content.yandexMetrikaId} />
    </ThemeProvider>
  );
}
