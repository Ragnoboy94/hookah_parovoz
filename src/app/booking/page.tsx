import { BookingForm } from "@/components/booking/BookingForm";
import { ThemeProvider } from "@/components/landing/ThemeProvider";
import { getContent } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo";
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

  return (
    <ThemeProvider content={content}>
      <div className="min-h-screen smoke-bg">
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

          <BookingForm content={content} />
        </main>
      </div>
    </ThemeProvider>
  );
}
