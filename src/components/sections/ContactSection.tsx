import React from 'react';
import Link from 'next/link';
import RevealOnScroll from '@/components/ui/RevealOnScroll';

export interface ContactDict {
  tag?: string;
  title?: string;
  description?: string;
  button?: string;
  emailLabel?: string;
  badge?: string;
  email?: string;
  editorialChannel?: string;
  proposalsTitle?: string;
  proposalsDesc?: string;
  directChannel?: string;
  directTitle?: string;
  directDesc?: string;
}

interface ContactSectionProps {
  lang: string;
  dict?: ContactDict;
}

export default function ContactSection({ lang, dict }: ContactSectionProps) {
  if (!dict) return null;

  const email = dict.email || 'contacto@cernapensamento.org';

  return (
    <section 
      aria-label={dict.tag || 'Contacto e colaboración'}
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
          {dict.tag && (
            <RevealOnScroll delayMs={50}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-[2px] bg-gold" aria-hidden="true" />
                <span className="text-xs font-bold text-gold uppercase tracking-[0.2em]">
                  {dict.tag}
                </span>
              </div>
            </RevealOnScroll>
          )}

          {dict.title && (
            <RevealOnScroll delayMs={100}>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-charcoal font-bold tracking-tight leading-tight mb-5">
                {dict.title}
              </h2>
            </RevealOnScroll>
          )}

          {dict.description && (
            <RevealOnScroll delayMs={150}>
              <p className="font-sans text-base sm:text-lg text-charcoal/75 leading-relaxed">
                {dict.description}
              </p>
            </RevealOnScroll>
          )}
        </div>

        {/* Action & Contact Cards: Balanced Two-Column Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-2">
          
          {/* Card 1: Proposal Submission via Contact Form */}
          <RevealOnScroll delayMs={200} className="h-full">
            <div className="bg-parchment border border-lines p-8 sm:p-10 flex flex-col justify-between h-full transition-all duration-300 hover:border-gold/60 hover:shadow-md relative group">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="material-symbols-outlined text-gold text-2xl" aria-hidden="true">
                    rate_review
                  </span>
                  <span className="font-mono text-xs uppercase tracking-widest text-charcoal/60">
                    {dict.editorialChannel || 'Vía Editorial'}
                  </span>
                </div>

                <h3 className="font-serif text-2xl text-charcoal font-semibold mb-3">
                  {dict.proposalsTitle || 'Propostas de Artigos e Ensaios'}
                </h3>
                <p className="font-sans text-sm text-charcoal/70 leading-relaxed mb-6">
                  {dict.proposalsDesc || 'Envía os teus borradores, colaboracións ou propostas para seren avaliadas polo Consello Editorial.'}
                </p>
              </div>

              <div className="pt-4 border-t border-lines/60 flex flex-col gap-4">
                <Link
                  href={`/${lang}/contacto`}
                  className="btn-primary text-xs tracking-[0.16em] font-bold w-full sm:w-auto inline-flex items-center justify-center gap-2 group"
                >
                  <span>{dict.button}</span>
                  <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          </RevealOnScroll>

          {/* Card 2: Direct Email & Association Inquiries */}
          <RevealOnScroll delayMs={250} className="h-full">
            <div className="bg-parchment border border-lines p-8 sm:p-10 flex flex-col justify-between h-full transition-all duration-300 hover:border-gold/60 hover:shadow-md relative group">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="material-symbols-outlined text-gold text-2xl" aria-hidden="true">
                    mail
                  </span>
                  <span className="font-mono text-xs uppercase tracking-widest text-charcoal/60">
                    {dict.directChannel || 'Canle Directa'}
                  </span>
                </div>

                <h3 className="font-serif text-2xl text-charcoal font-semibold mb-3">
                  {dict.directTitle || 'Consultas Xerais e Institucionais'}
                </h3>
                <p className="font-sans text-sm text-charcoal/70 leading-relaxed mb-6">
                  {dict.directDesc || 'Para cuestións sobre a asociación, adhesións, consultas estatutarias ou prensa, podes escribirnos directamente.'}
                </p>
              </div>

              <div className="pt-4 border-t border-lines/60 flex flex-col gap-3">
                <a
                  href={`mailto:${email}`}
                  className="btn-outline text-xs tracking-[0.1em] font-mono py-3 px-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 group/email"
                >
                  <span className="material-symbols-outlined text-gold text-base group-hover/email:text-parchment transition-colors" aria-hidden="true">
                    alternate_email
                  </span>
                  <span className="font-semibold text-charcoal group-hover/email:text-parchment transition-colors">
                    {email}
                  </span>
                </a>
              </div>
            </div>
          </RevealOnScroll>

        </div>

      </div>
    </section>
  );
}
