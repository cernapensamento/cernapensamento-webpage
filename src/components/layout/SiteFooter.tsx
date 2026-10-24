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
  const isEs = lang === 'es';

  // Fallback defaults for footer columns
  const brandDesc = dict.footer?.brandDescription || (isEs
    ? 'Revista digital de pensamiento, filosofía política, economía y cultura. Un proyecto editorial independiente comprometido con el debate riguroso y la libertad de pensamiento en Galicia.'
    : 'Revista dixital de pensamento, filosofía política, economía e cultura. Un proxecto editorial independente comprometido co debate rigoroso e a liberdade de pensamento en Galicia.');

  const locationText = dict.footer?.location || 'Galicia, España';
  const privacyText = dict.footer?.privacy || (isEs ? 'Privacidad' : 'Privacidade');

  const pubCols = dict.footer?.columns?.publications;
  const assocCols = dict.footer?.columns?.association;
  const cernaCols = dict.footer?.columns?.cerna;

  return (
    <FooterVisibilityWrapper>
      <footer className="w-full mt-auto bg-parchment text-charcoal border-t border-lines transition-colors duration-200">
        
        {/* ==================================================== */}
        {/* FOOTER: 4 COLUMNS */}
        {/* ==================================================== */}
        <div className="w-full py-16 sm:py-20 px-5 md:px-16 bg-parchment">
          <div className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
            
            {/* Column 1: Brand & Contact (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <Link href={`/${lang}`} className="inline-block hover:opacity-80 transition-opacity">
                <Image
                  src="/images/logo/cernawhite.png"
                  alt={SITE_NAME}
                  width={260}
                  height={65}
                  className="h-12 md:h-14 w-auto object-contain block dark:hidden"
                />
                <Image
                  src="/images/logo/cernablack.png"
                  alt={SITE_NAME}
                  width={260}
                  height={65}
                  className="h-12 md:h-14 w-auto object-contain hidden dark:block brightness-0 invert"
                />
              </Link>

              <p className="font-sans text-sm text-charcoal/70 leading-relaxed max-w-sm">
                {brandDesc}
              </p>

              {/* Direct details */}
              <div className="flex flex-col gap-2.5 text-xs text-charcoal/70 font-sans">
                <a 
                  href="mailto:contacto@cernapensamento.org" 
                  className="flex items-center gap-2.5 hover:text-charcoal transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-gold">mail</span>
                  <span>contacto@cernapensamento.org</span>
                </a>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[16px] text-gold">location_on</span>
                  <span>{locationText}</span>
                </div>
              </div>

              {/* Social links */}
              <SocialLinks 
                className="flex items-center gap-4 mt-2" 
                itemClassName="bg-surface text-charcoal hover:bg-gold hover:text-parchment border border-lines transition-colors" 
              />
            </div>

            {/* Column 2: Publicacións (2-3 cols) */}
            <div className="lg:col-span-2 lg:col-start-7 flex flex-col gap-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal font-sans">
                {pubCols?.title || (isEs ? 'PUBLICACIONES' : 'PUBLICACIÓNS')}
              </span>
              <ul className="flex flex-col gap-2.5 text-sm text-charcoal/70 font-sans">
                <li>
                  <Link href={`/${lang}/articulos?tipo=artigo`} className="hover:text-gold transition-colors">
                    {pubCols?.opinion || (isEs ? 'Artículos de Opinión' : 'Artigos de Opinión')}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/articulos?tipo=ensaio`} className="hover:text-gold transition-colors">
                    {pubCols?.essays || (isEs ? 'Ensayos Filosóficos' : 'Ensaios Filosóficos')}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/proyecto-editorial/coleccion-narrativa`} className="hover:text-gold transition-colors">
                    {pubCols?.narrative || 'Colección Narrativa'}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/proyecto-editorial/coleccion-poesia`} className="hover:text-gold transition-colors">
                    {pubCols?.poetry || 'Colección Poesía'}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/articulos`} className="hover:text-gold transition-colors">
                    {pubCols?.generalArchive || (isEs ? 'Archivo General' : 'Arquivo Xeral')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Asociación (2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal font-sans">
                {assocCols?.title || 'ASOCIACIÓN'}
              </span>
              <ul className="flex flex-col gap-2.5 text-sm text-charcoal/70 font-sans">
                <li>
                  <Link href={`/${lang}/asociacion`} className="hover:text-gold transition-colors">
                    {assocCols?.project || (isEs ? 'El Proyecto' : 'O Proxecto')}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/asociacion/estatutos`} className="hover:text-gold transition-colors">
                    {assocCols?.statutes || 'Estatutos'}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/noticias`} className="hover:text-gold transition-colors">
                    {assocCols?.news || (isEs ? 'Noticias y Avisos' : 'Novas e Avisos')}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/contacto`} className="hover:text-gold transition-colors">
                    {assocCols?.join || 'Asociarse'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Cerna / Institucional (2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal font-sans">
                {cernaCols?.title || 'CERNA'}
              </span>
              <ul className="flex flex-col gap-2.5 text-sm text-charcoal/70 font-sans">
                <li>
                  <Link href={`/${lang}/autores`} className="hover:text-gold transition-colors">
                    {cernaCols?.authors || (isEs ? 'Autores y Firmas' : 'Autores e Firmas')}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/contacto`} className="hover:text-gold transition-colors">
                    {cernaCols?.contact || 'Contacto'}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/escritorio`} className="hover:text-gold transition-colors">
                    {cernaCols?.authorDesk || 'Escritorio de Autor'}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/login`} className="hover:text-gold transition-colors">
                    {cernaCols?.login || (isEs ? 'Iniciar Sesión' : 'Iniciar Sesión')}
                  </Link>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* ==================================================== */}
        {/* BOTTOM LEGAL BAR */}
        {/* ==================================================== */}
        <div className="w-full border-t border-lines bg-surface/50 py-8 px-5 md:px-16 text-xs text-charcoal/60">
          <div className="max-w-[1120px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>
              © {currentYear} {SITE_NAME}. {dict.footer?.rights}
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link href={`/${lang}/privacidad`} className="hover:text-charcoal transition-colors">
                {privacyText}
              </Link>
              <Link href={`/${lang}/asociacion/estatutos`} className="hover:text-charcoal transition-colors">
                {dict.footer?.links?.estatutos}
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
