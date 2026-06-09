import {
  formatScheduleLine,
  WEEKDAY_LABELS,
} from "@/lib/schedule";
import type { SiteContent } from "@/lib/types";

interface ContactProps {
  content: SiteContent;
}

export function Contact({ content }: ContactProps) {
  const phoneHref = `tel:${content.phone.replace(/[^\d+]/g, "")}`;
  const mapQuery = encodeURIComponent(content.address);
  const mapUrl = `https://yandex.ru/maps/?text=${mapQuery}`;

  return (
    <section id="contact" className="px-6 py-20">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        <div className="glass-card rounded-2xl p-8">
          <h2 className="font-display text-2xl font-semibold mb-6">Контакты</h2>

          <div className="space-y-5">
            <address className="not-italic">
              <p className="text-muted text-sm mb-1">Адрес</p>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg hover:underline underline-offset-4"
                style={{ color: content.theme.primaryColor }}
              >
                {content.address}, Калининград
              </a>
            </address>

            <div>
              <p className="text-muted text-sm mb-1">Телефон</p>
              <a
                href={phoneHref}
                className="text-lg font-medium hover:underline underline-offset-4"
              >
                {content.phone}
              </a>
            </div>
          </div>

          {content.booking.enabled && (
            <a href="/booking" className="mt-6 inline-flex btn-primary text-sm py-2 px-5">
              Забронировать столик онлайн
            </a>
          )}
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h2 className="font-display text-2xl font-semibold mb-6">
            Часы работы
          </h2>
          <ul className="space-y-3">
            {content.schedule.days.map((day, i) => (
              <li
                key={WEEKDAY_LABELS[i]}
                className="flex justify-between items-center text-sm sm:text-base"
              >
                <span className="text-muted w-8">{WEEKDAY_LABELS[i]}</span>
                <span className="flex-1 border-b border-dashed border-white/10 mx-3" />
                <span>{formatScheduleLine(day)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
