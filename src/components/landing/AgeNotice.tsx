interface AgeNoticeProps {
  text: string;
}

export function AgeNotice({ text }: AgeNoticeProps) {
  if (!text.trim()) return null;

  return (
    <section className="px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="glass-card rounded-2xl px-6 py-5 border border-amber-500/20 bg-amber-500/5">
          <div className="flex gap-4 items-start">
            <span
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-amber-500/20 text-amber-400"
              aria-hidden
            >
              18+
            </span>
            <p className="text-sm sm:text-base text-muted leading-relaxed">{text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
