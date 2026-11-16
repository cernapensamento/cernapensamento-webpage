import React from 'react';
import Link from 'next/link';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import { getDictionaryClient, type Dictionary } from '@/dictionaries/client';

export type ContactDict = Partial<Dictionary['contact']>;

interface ContactSectionProps {
  lang: string;
  dict?: ContactDict;
}

interface ContactCardShellProps {
  delayMs: number;
  icon: string;
  channel: string;
  title: string;
  description: string;
  action: React.ReactNode;
}

function ContactChannelCard({
  delayMs,
  icon,
  channel,
  title,
  description,
  action,
}: ContactCardShellProps) {
  return (
    <RevealOnScroll delayMs={delayMs} className="h-full">
      <div className="bg-parchment border border-lines p-8 sm:p-10 flex flex-col justify-between h-full transition-all duration-300 hover:border-gold/60 hover:shadow-md relative group">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <span className="material-symbols-outlined text-gold text-2xl" aria-hidden="true">
              {icon}
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-charcoal/60">
              {channel}
            </span>
          </div>

          <h3 className="font-serif text-2xl text-charcoal font-semibold mb-3">
            {title}
          </h3>
          <p className="font-sans text-sm text-charcoal/70 leading-relaxed mb-6">
            {description}
          </p>
        </div>

        <div className="pt-4 border-t border-lines/60 flex flex-col gap-3">
          {action}
        </div>
      </div>
    </RevealOnScroll>
  );
}

export default function ContactSection({ lang, dict }: ContactSectionProps) {
  if (!dict) return null;

  const t = { ...getDictionaryClient(lang).contact, ...dict };

  return (
    <section
      aria-label={t.tag}
      className="w-full bg-surface border-t border-lines py-20 sm:py-28 px-5 md:px-16 transition-colors relative overflow-hidden"
    >
      {/* Decorative literary watermark */}
      <span
        aria-hidden="true"
        className="absolute -right-8 -bottom-10 text-[200px] md:text-[260px] font-serif text-charcoal/[0.03] dark:text-parchment/[0.03] select-none pointer-events-none leading-none"
      >
        @
      </span>

      <div className="max-w-[1120px] mx-auto flex flex-col gap-12 relative z-10">
        {/* Header Block: Centered Editorial Presentation */}
        <div className="max-w-3xl">
          {t.tag && (
            <RevealOnScroll delayMs={50}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-[2px] bg-gold" aria-hidden="true" />
                <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
                  {t.tag}
                </span>
              </div>
            </RevealOnScroll>
          )}

          {t.title && (
            <RevealOnScroll delayMs={100}>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-charcoal font-bold tracking-tight leading-tight mb-5">
                {t.title}
              </h2>
            </RevealOnScroll>
          )}

          {t.description && (
            <RevealOnScroll delayMs={150}>
              <p className="font-sans text-base sm:text-lg text-charcoal/75 leading-relaxed">
                {t.description}
              </p>
            </RevealOnScroll>
          )}
        </div>

        {/* Action & Contact Cards: Balanced Two-Column Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-2">
          <ContactChannelCard
            delayMs={200}
            icon="rate_review"
            channel={t.editorialChannel}
            title={t.proposalsTitle}
            description={t.proposalsDesc}
            action={
              <Link
                href={`/${lang}/contacto`}
                className="btn-primary text-xs tracking-[0.16em] font-bold w-full sm:w-auto inline-flex items-center justify-center gap-2 group"
              >
                <span>{t.button}</span>
                <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            }
          />

          <ContactChannelCard
            delayMs={250}
            icon="mail"
            channel={t.directChannel}
            title={t.directTitle}
            description={t.directDesc}
            action={
              <a
                href={`mailto:${t.email}`}
                className="btn-outline text-xs tracking-[0.1em] font-mono py-3 px-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 group/email"
              >
                <span className="material-symbols-outlined text-gold text-base group-hover/email:text-parchment transition-colors" aria-hidden="true">
                  alternate_email
                </span>
                <span className="font-semibold text-charcoal group-hover/email:text-parchment transition-colors">
                  {t.email}
                </span>
              </a>
            }
          />
        </div>
      </div>
    </section>
  );
}
