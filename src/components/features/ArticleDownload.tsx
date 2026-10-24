interface ArticleDownloadProps {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
}

export default function ArticleDownload({
  href,
  eyebrow,
  title,
  description,
  cta,
}: ArticleDownloadProps) {
  return (
    <section
      data-print="hide"
      aria-labelledby="article-download-heading"
      className="mt-16 border-t border-lines pt-10"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-gold">
            {eyebrow}
          </p>

          <h3
            id="article-download-heading"
            className="mt-3 font-serif text-2xl text-charcoal"
          >
            {title}
          </h3>

          <p className="mt-2 font-sans text-sm leading-relaxed text-charcoal/60">
            {description}
          </p>
        </div>

        <a
          href={href}
          download
          className="group inline-flex shrink-0 items-center justify-center gap-3 border border-charcoal bg-charcoal px-7 py-3.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-parchment transition-all duration-300 hover:border-gold hover:bg-gold hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-y-0.5"
          >
            download
          </span>
          {cta}
        </a>
      </div>
    </section>
  );
}
