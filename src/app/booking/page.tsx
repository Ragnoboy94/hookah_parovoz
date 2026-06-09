import { BookingForm } from "@/components/booking/BookingForm";
import { JsonLd } from "@/components/landing/JsonLd";
import { ThemeProvider } from "@/components/landing/ThemeProvider";
import { getBookingBusinessDate } from "@/lib/booking";
import { getContent } from "@/lib/content";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const content = await getContent();
  return buildPageMetadata(content, {
    title: `Бронирование столика — ${content.title}`,
    description: `Забронируйте столик в кальянной ${content.title}. ${content.address}. Онлайн-бронирование на удобное время.`,
    path: "/booking",
  });
}

export default async function BookingPage() {
  const content = await getContent();

  if (!content.booking.enabled) {
    redirect("/");
  }

  const businessDate = getBookingBusinessDate(content);
  const businessDateLabel = new Date(`${businessDate}T12:00:00`).toLocaleDateString(
    "ru-RU",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: content.timezone,
    },
  );

  const breadcrumbs = buildBreadcrumbJsonLd(content, [
    { name: content.title, path: "/" },
    { name: "Бронирование столика", path: "/booking" },
  ]);

  return (
    <ThemeProvider content={content}>
      <JsonLd data={breadcrumbs} />
      <div className="site-bg min-h-screen">
        <header className="px-6 py-6 flex items-center justify-between max-w-xl mx-auto">
          <Link href="/" className="text-muted text-sm hover:text-foreground">
            ← {content.title}
          </Link>
        </header>

        <main className="px-6 pb-20">
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl font-bold mb-2">
              Бронирование столика
            </h1>
            <p className="text-muted">{content.address}</p>
          </div>

          <BookingForm
            content={content}
            businessDate={businessDate}
            businessDateLabel={businessDateLabel}
          />
        </main>
      </div>
    </ThemeProvider>
  );
}
