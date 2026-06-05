import type { OpenStatus, SiteContent } from "@/lib/types";

interface HeroProps {
  content: SiteContent;
  status: OpenStatus;
}

export function Hero({ content, status }: HeroProps) {
  const phoneHref = `tel:${content.phone.replace(/[^\d+]/g, "")}`;

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-24 text-center smoke-bg">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: content.theme.primaryColor }}
        />
      </div>

      <div className="relative z-10 max-w-3xl animate-fade-up">
        <p className="text-muted text-sm uppercase tracking-[0.3em] mb-4">
          Кальянная
        </p>
        <h1 className="font-display text-5xl sm:text-7xl font-bold mb-4 tracking-tight">
          {content.title}
        </h1>
        <p className="text-xl sm:text-2xl text-muted mb-8 font-light">
          {content.subtitle}
        </p>

        <div className="inline-flex items-center gap-3 glass-card rounded-full px-5 py-2.5 mb-10">
          <span
            className={`status-dot ${status.isOpen ? "open" : "closed"}`}
          />
          <span className="text-sm sm:text-base">{status.label}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {content.booking.enabled && (
            <a href="/booking" className="btn-primary w-full sm:w-auto">
              Забронировать столик
            </a>
          )}
          <a href={phoneHref} className={content.booking.enabled ? "btn-ghost w-full sm:w-auto" : "btn-primary w-full sm:w-auto"}>
            Позвонить
          </a>
          <a href="#menu" className="btn-ghost w-full sm:w-auto">
            Меню
          </a>
        </div>
      </div>
    </section>
  );
}
