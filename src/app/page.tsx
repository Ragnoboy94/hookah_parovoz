import { Contact } from "@/components/landing/Contact";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Menu } from "@/components/landing/Menu";
import { ThemeProvider } from "@/components/landing/ThemeProvider";
import { YandexMetrika } from "@/components/landing/YandexMetrika";
import { getContent } from "@/lib/content";
import { getOpenStatus } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await getContent();
  const status = getOpenStatus(content);

  return (
    <ThemeProvider content={content}>
      <main>
        <Hero content={content} status={status} />
        <Menu content={content} />
        <Contact content={content} />
        <Footer content={content} />
      </main>
      <YandexMetrika id={content.yandexMetrikaId} />
    </ThemeProvider>
  );
}
