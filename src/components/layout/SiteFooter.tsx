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

  return (
    <FooterVisibilityWrapper>
      <footer className="w-full mt-auto bg-[#0a0a0a] text-[#ffffff] border-t border-lines/30">
        
        {/* ==================================================== */}
        {/* UPPER CTA SECTION (OSIX STYLE COMBINED CONTACT BANNER) */}
        {/* ==================================================== */}
        <div className="w-full border-b border-[#ffffff15] py-16 sm:py-24 px-5 md:px-16">
          <div className="max-w-[1120px] mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
            
            {/* Left Headline & Description */}
            <div className="max-w-2xl">
              <span className="text-xs font-bold text-gold uppercase tracking-[0.2em] block mb-3">
                {dict.contact?.tag}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#ffffff] font-bold tracking-tight leading-tight mb-4">
                {dict.contact?.title}
              </h2>
              <p className="font-sans text-base sm:text-lg text-[#a3a3a3] leading-relaxed max-w-xl mb-4">
                {dict.contact?.description}
              </p>
              {dict.contact?.badge && (
                <div className="flex items-center gap-2 text-xs font-mono text-[#a3a3a3]/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
                  <span>{dict.contact.badge}</span>
                </div>
              )}
            </div>

            {/* Right Action Button & Secondary Contact */}
            <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
              <Link
                href={`/${lang}/contacto`}
                className="btn-filled-white text-xs tracking-[0.15em] font-bold"
              >
                <span>{dict.contact?.button}</span>
                <span aria-hidden="true">→</span>
              </Link>
              <a
                href={`mailto:${dict.contact?.email || 'contacto@cernapensamento.org'}`}
                className="text-xs text-[#a3a3a3] hover:text-[#ffffff] underline underline-offset-4 transition-colors font-sans"
              >
                {dict.contact?.emailLabel ? `${dict.contact.emailLabel} ${dict.contact?.email || 'contacto@cernapensamento.org'}` : `contacto@cernapensamento.org`}
              </a>
            </div>

          </div>
        </div>

        {/* ==================================================== */}
        {/* LOWER FOOTER: 4 COLUMNS */}
        {/* ==================================================== */}
        <div className="w-full py-16 sm:py-20 px-5 md:px-16">
          <div className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
            
            {/* Column 1: Brand & Contact (4 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <Link href={`/${lang}`} className="inline-block hover:opacity-80 transition-opacity">
                <Image
                  src="/images/logo/cernablack.png"
                  alt={SITE_NAME}
                  width={220}
                  height={55}
                  className="h-10 w-auto object-contain brightness-0 invert"
                />
              </Link>

              <p className="font-sans text-sm text-[#a3a3a3] leading-relaxed max-w-sm">
                {isEs
                  ? 'Revista digital de pensamiento, filosofía política, economía y cultura. Un proyecto editorial independiente comprometido con el debate riguroso y la libertad de pensamiento en Galicia.'
                  : 'Revista dixital de pensamento, filosofía política, economía e cultura. Un proxecto editorial independente comprometido co debate rigoroso e a liberdade de pensamento en Galicia.'}
              </p>

              {/* Direct details */}
              <div className="flex flex-col gap-2.5 text-xs text-[#a3a3a3] font-sans">
                <a 
                  href="mailto:contacto@cernapensamento.org" 
                  className="flex items-center gap-2.5 hover:text-[#ffffff] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-gold">mail</span>
                  <span>contacto@cernapensamento.org</span>
                </a>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[16px] text-gold">location_on</span>
                  <span>Galicia, España</span>
                </div>
              </div>

              {/* Social links */}
              <SocialLinks 
                className="flex items-center gap-4 mt-2" 
                itemClassName="bg-[#1a1a1a] text-[#ffffff] hover:bg-gold hover:text-black border border-[#ffffff15]" 
              />
            </div>

            {/* Column 2: Publicacións (2-3 cols) */}
            <div className="lg:col-span-2 lg:col-start-7 flex flex-col gap-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ffffff] font-sans">
                {isEs ? 'PUBLICACIONES' : 'PUBLICACIÓNS'}
              </span>
              <ul className="flex flex-col gap-2.5 text-sm text-[#a3a3a3] font-sans">
                <li>
                  <Link href={`/${lang}/articulos?tipo=artigo`} className="hover:text-[#ffffff] transition-colors">
                    {isEs ? 'Artículos de Opinión' : 'Artigos de Opinión'}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/articulos?tipo=ensaio`} className="hover:text-[#ffffff] transition-colors">
                    {isEs ? 'Ensayos Filosóficos' : 'Ensaios Filosóficos'}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/proyecto-editorial/coleccion-narrativa`} className="hover:text-[#ffffff] transition-colors">
                    {isEs ? 'Colección Narrativa' : 'Colección Narrativa'}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/proyecto-editorial/coleccion-poesia`} className="hover:text-[#ffffff] transition-colors">
                    {isEs ? 'Colección Poesía' : 'Colección Poesía'}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/articulos`} className="hover:text-[#ffffff] transition-colors">
                    {isEs ? 'Archivo General' : 'Arquivo Xeral'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Asociación (2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ffffff] font-sans">
                {isEs ? 'ASOCIACIÓN' : 'ASOCIACIÓN'}
              </span>
              <ul className="flex flex-col gap-2.5 text-sm text-[#a3a3a3] font-sans">
                <li>
                  <Link href={`/${lang}/asociacion`} className="hover:text-[#ffffff] transition-colors">
                    {isEs ? 'El Proyecto' : 'O Proxecto'}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/asociacion/estatutos`} className="hover:text-[#ffffff] transition-colors">
                    {isEs ? 'Estatutos' : 'Estatutos'}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/noticias`} className="hover:text-[#ffffff] transition-colors">
                    {isEs ? 'Noticias y Avisos' : 'Novas e Avisos'}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/contacto`} className="hover:text-[#ffffff] transition-colors">
                    {isEs ? 'Asociarse' : 'Asociarse'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Cerna / Institucional (2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ffffff] font-sans">
                CERNA
              </span>
              <ul className="flex flex-col gap-2.5 text-sm text-[#a3a3a3] font-sans">
                <li>
                  <Link href={`/${lang}#autores`} className="hover:text-[#ffffff] transition-colors">
                    {isEs ? 'Autores y Firmas' : 'Autores e Firmas'}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/contacto`} className="hover:text-[#ffffff] transition-colors">
                    {isEs ? 'Contacto' : 'Contacto'}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/escritorio`} className="hover:text-[#ffffff] transition-colors">
                    {isEs ? 'Escritorio de Autor' : 'Escritorio de Autor'}
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/login`} className="hover:text-[#ffffff] transition-colors">
                    {isEs ? 'Iniciar Sesión' : 'Iniciar Sesión'}
                  </Link>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* ==================================================== */}
        {/* BOTTOM LEGAL BAR */}
        {/* ==================================================== */}
        <div className="w-full border-t border-[#ffffff15] py-8 px-5 md:px-16 text-xs text-[#a3a3a3]">
          <div className="max-w-[1120px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>
              © {currentYear} {SITE_NAME}. {dict.footer.rights}
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link href={`/${lang}/asociacion/estatutos`} className="hover:text-[#ffffff] transition-colors">
                {isEs ? 'Privacidad' : 'Privacidade'}
              </Link>
              <Link href={`/${lang}/asociacion/estatutos`} className="hover:text-[#ffffff] transition-colors">
                {dict.footer.links.estatutos}
              </Link>
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
