import type { SiteContent } from "@/lib/types";
import { getSeo } from "@/lib/seo";

interface SeoIntroProps {
  content: SiteContent;
}

export function SeoIntro({ content }: SeoIntroProps) {
  const seo = getSeo(content);

  return (
    <section className="px-6 py-16 border-t border-white/5" aria-label="О заведении">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold">
          Кальянная {content.title} в {seo.city}
        </h2>
        <p className="text-muted leading-relaxed">
          {content.title} — lounge-кальянная в центре {seo.city} на{" "}
          {content.address}. {content.subtitle}. У нас можно расслабиться с
          качественным кальяном, выбрать напитки из меню и провести вечер в
          уютной атмосфере.
          {content.booking.enabled &&
            " Забронируйте столик онлайн — это быстро и удобно."}
        </p>
      </div>
    </section>
  );
}
