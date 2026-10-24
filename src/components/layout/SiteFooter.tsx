import Link from 'next/link';
import Image from 'next/image';
import { SITE_NAME } from '@/lib/constants';
import { headers } from 'next/headers';
import { getDictionary } from '@/dictionaries';
import { Locale } from '@/i18n-config';
import FooterVisibilityWrapper from './FooterVisibilityWrapper';
import SocialLinks from '@/components/ui/SocialLinks';

export default async function SiteFooter() {
  const headersList = await headers();
  const lang = (headersList.get('x-locale') as Locale) || 'gl';
  const dict = await getDictionary(lang);
  const currentYear = new Date().getFullYear();
  const brandDesc = dict.footer?.brandDescription;
  const locationText = dict.footer?.location || 'Galicia, España';
  const privacyText = dict.footer?.privacy || 'Privacidade';

  const pubCols = dict.footer?.columns?.publications;
  const assocCols = dict.footer?.columns?.association;
  const cernaCols = dict.footer?.columns?.cerna;

  return (
    <FooterVisibilityWrapper>
      <footer className="w-full mt-auto bg-parchment text-charcoal border-t border-lines transition-colors duration-200">
        
        {/* ==================================================== */}
        {/* FOOTER: RESPONSIVE MULTI-COLUMN LAYOUT */}
        {/* ==================================================== */}
        <div className="w-full py-14 sm:py-16 md:py-20 px-5 md:px-16 bg-parchment">
          <div className="max-w-[1120px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-8 items-start">
            
            {/* Column 1: Brand & Contact (Full on mobile, 5 cols on lg) */}
            <div className="sm:col-span-2 lg:col-span-5 flex flex-col gap-5 sm:gap-6">
              <Link href={`/${lang}`} className="inline-block hover:opacity-80 transition-opacity">
                <Image
                  src="/images/logo/cernawhite.png"
                  alt={SITE_NAME}
                  width={430}
                  height={159}
                  className="h-20 sm:h-24 md:h-28 w-auto object-contain block dark:hidden"
                />
                <Image
                  src="/images/logo/cernablack.png"
                  alt={SITE_NAME}
                  width={430}
                  height={159}
                  className="h-20 sm:h-24 md:h-28 w-auto object-contain hidden dark:block brightness-0 invert"
                />
              </Link>

              <p className="font-sans text-xs sm:text-sm text-charcoal/70 leading-relaxed max-w-sm">
                {brandDesc}
              </p>

              {/* Direct details */}
              <div className="flex flex-col gap-2.5 text-xs text-charcoal/70 font-sans">
                <a 
                  href="mailto:contacto@cernapensamento.org" 
                  className="flex items-center gap-2.5 hover:text-gold transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-gold shrink-0">mail</span>
                  <span className="truncate">contacto@cernapensamento.org</span>
                </a>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[16px] text-gold shrink-0">location_on</span>
                  <span>{locationText}</span>
                </div>
              </div>

              {/* Social links */}
              <SocialLinks 
                className="flex items-center gap-3.5 mt-1 sm:mt-2" 
                itemClassName="bg-surface text-charcoal hover:bg-gold hover:text-parchment border border-lines transition-colors" 
              />
            </div>

            {/* Column 2: Publicacións (sm: col-span-1, lg: 2 cols) */}
            <div className="sm:col-span-1 lg:col-span-2 lg:col-start-7 flex flex-col gap-3.5 sm:gap-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal font-sans">
                {pubCols?.title}
              </span>
              <ul className="flex flex-col gap-2.5 text-xs sm:text-sm text-charcoal/70 font-sans">
                <li>
                  <Link href={`/${lang}/articulos?tipo=article`} className="hover:text-gold transition-colors py-0.5 inline-block">
                    {pubCols?.opinion}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/articulos?tipo=essay`} className="hover:text-gold transition-colors py-0.5 inline-block">
                    {pubCols?.essays}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/articulos?tipo=column`} className="hover:text-gold transition-colors py-0.5 inline-block">
                    {pubCols?.narrative}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/articulos?tipo=poetry`} className="hover:text-gold transition-colors py-0.5 inline-block">
                    {pubCols?.poetry}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/articulos`} className="hover:text-gold transition-colors py-0.5 inline-block">
                    {pubCols?.generalArchive}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Asociación (sm: col-span-1, lg: 2 cols) */}
            <div className="sm:col-span-1 lg:col-span-2 flex flex-col gap-3.5 sm:gap-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal font-sans">
                {assocCols?.title}
              </span>
              <ul className="flex flex-col gap-2.5 text-xs sm:text-sm text-charcoal/70 font-sans">
                <li>
                  <Link href={`/${lang}/asociacion`} className="hover:text-gold transition-colors py-0.5 inline-block">
                    {assocCols?.project}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/asociacion#estatutos`} className="hover:text-gold transition-colors py-0.5 inline-block">
                    {assocCols?.statutes}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/noticias`} className="hover:text-gold transition-colors py-0.5 inline-block">
                    {assocCols?.news}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/contacto`} className="hover:text-gold transition-colors py-0.5 inline-block">
                    {assocCols?.join}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Cerna / Institucional (sm: col-span-2 or 1, lg: 2 cols) */}
            <div className="sm:col-span-2 md:col-span-1 lg:col-span-2 flex flex-col gap-3.5 sm:gap-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal font-sans">
                {cernaCols?.title}
              </span>
              <ul className="flex flex-col gap-2.5 text-xs sm:text-sm text-charcoal/70 font-sans">
                <li>
                  <Link href={`/${lang}/autores`} className="hover:text-gold transition-colors py-0.5 inline-block">
                    {cernaCols?.authors}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/contacto`} className="hover:text-gold transition-colors py-0.5 inline-block">
                    {cernaCols?.contact}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/escritorio`} className="hover:text-gold transition-colors py-0.5 inline-block">
                    {cernaCols?.authorDesk}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/login`} className="hover:text-gold transition-colors py-0.5 inline-block">
                    {cernaCols?.login}
                  </Link>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* ==================================================== */}
        {/* BOTTOM LEGAL BAR */}
        {/* ==================================================== */}
        <div className="w-full border-t border-lines bg-surface/50 py-6 sm:py-8 px-5 md:px-16 text-xs text-charcoal/60">
          <div className="max-w-[1120px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="font-sans">
              © {currentYear} {SITE_NAME}. {dict.footer?.rights}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-2 font-sans">
              <Link href={`/${lang}/privacidad`} className="hover:text-charcoal transition-colors">
                {privacyText}
              </Link>
              <Link href={`/${lang}/asociacion#estatutos`} className="hover:text-charcoal transition-colors">
                {dict.footer?.links?.estatutos || 'Estatutos'}
              </Link>
              <a
                href="https://github.com/cernapensamento/cernapensamento-webpage"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-charcoal transition-colors inline-flex items-center gap-1.5"
              >
                <span>GitHub</span>
                <span aria-hidden="true" className="text-[10px]">↗</span>
              </a>
              <a href="/llms.txt" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors font-mono">
                llms.txt
              </a>
            </div>
          </div>
        </div>

      </footer>
    </FooterVisibilityWrapper>
  );
}
