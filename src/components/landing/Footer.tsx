import type { SiteContent } from "@/lib/types";

interface FooterProps {
  content: SiteContent;
}

const SOCIAL_LABELS: Record<keyof SiteContent["social"], string> = {
  vk: "VK",
  telegram: "Telegram",
  instagram: "Instagram",
  facebook: "Facebook",
};

export function Footer({ content }: FooterProps) {
  const socialLinks = (
    Object.entries(content.social) as [keyof SiteContent["social"], string][]
  ).filter(([, url]) => url.trim() !== "");

  const reviewLinks = content.reviews.enabled
    ? (
        [
          ["google", content.reviews.google, "Google"],
          ["yandex", content.reviews.yandex, "Яндекс"],
          ["gis2", content.reviews.gis2, "2ГИС"],
        ] as const
      ).filter(([, url]) => url.trim() !== "")
    : [];

  return (
    <footer className="px-6 py-12 border-t border-white/5">
      <div className="max-w-5xl mx-auto space-y-8">
        {(socialLinks.length > 0 || reviewLinks.length > 0) && (
          <div className="flex flex-wrap justify-center gap-4">
            {socialLinks.map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-sm py-2 px-4"
              >
                {SOCIAL_LABELS[key]}
              </a>
            ))}
            {reviewLinks.map(([key, url, label]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-sm py-2 px-4"
              >
                Отзывы · {label}
              </a>
            ))}
          </div>
        )}

        <p className="text-center text-muted text-xs max-w-lg mx-auto leading-relaxed">
          © {new Date().getFullYear()} {content.title} — кальянная в Калининграде.
          {content.booking.enabled && (
            <>
              {" "}
              <a href="/booking" className="underline underline-offset-2 hover:text-foreground">
                Бронь столика онлайн
              </a>
              .
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
