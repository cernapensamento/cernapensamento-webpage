import Link from 'next/link';
import { SITE_NAME } from '@/lib/constants';
import { headers } from 'next/headers';
import { getDictionary } from '@/dictionaries';
import { Locale } from '@/i18n-config';

export default async function SiteFooter() {
  const headersList = await headers();
  const lang = (headersList.get('x-locale') as Locale) || 'gl';
  const dict = await getDictionary(lang);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-lines w-full mt-auto">
      <div className="w-full py-16 px-5 md:px-16 flex flex-col items-center gap-8 max-w-[1120px] mx-auto">
        
        {/* Brand & Tagline */}
        <div className="flex flex-col items-center text-center gap-3">
          <Link 
            className="font-serif text-3xl md:text-4xl text-charcoal hover:opacity-80 transition-opacity" 
            href={`/${lang}`}
          >
            {SITE_NAME}
          </Link>
          <p className="text-sm md:text-base font-sans text-charcoal/70 max-w-md">
            Discurso intelectual e filosófico.
          </p>
        </div>

        {/* Navigation */}
        <nav 
          aria-label="Footer Navigation" 
          className="flex flex-wrap justify-center gap-x-8 gap-y-4 w-full max-w-2xl"
        >
          <Link className="font-sans text-sm font-medium text-charcoal/80 hover:text-gold transition-colors duration-200" href={`/${lang}`}>Inicio</Link>
          <Link className="font-sans text-sm font-medium text-charcoal/80 hover:text-gold transition-colors duration-200" href={`/${lang}/asociacion`}>{dict.footer.links.asociacion}</Link>
          <Link className="font-sans text-sm font-medium text-charcoal/80 hover:text-gold transition-colors duration-200" href={`/${lang}/articulos`}>{dict.nav.articulos}</Link>
          <Link className="font-sans text-sm font-medium text-charcoal/80 hover:text-gold transition-colors duration-200" href={`/${lang}/asociacion/estatutos`}>{dict.footer.links.estatutos}</Link>
          <Link className="font-sans text-sm font-medium text-charcoal/80 hover:text-gold transition-colors duration-200" href={`/${lang}/colabora`}>Colabora</Link>
          <Link className="font-sans text-sm font-medium text-charcoal/80 hover:text-gold transition-colors duration-200" href={`/${lang}/noticias`}>{dict.nav.noticias}</Link>
        </nav>

        {/* Social Icons */}
        <div className="flex items-center justify-center gap-5 mt-2">
          <a 
            href="mailto:contacto@cernapensamento.org" 
            className="w-12 h-12 flex items-center justify-center border border-lines rounded-full text-charcoal hover:text-gold hover:border-gold transition-all duration-300 bg-surface hover:shadow-sm"
            aria-label="Contacto por Correo"
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">mail</span>
          </a>
          <a 
            href="https://www.instagram.com/cernapensamento" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-12 h-12 flex items-center justify-center border border-lines rounded-full text-charcoal hover:text-gold hover:border-gold transition-all duration-300 bg-surface hover:shadow-sm"
            aria-label="Instagram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-lines/50 max-w-3xl my-2"></div>

        {/* Copyright & Credits */}
        <div className="flex flex-col items-center text-center gap-3">
          <p className="text-xs md:text-sm font-semibold text-charcoal/60">
            © {currentYear} {SITE_NAME}. {dict.footer.rights}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-charcoal/50">
            <span>Portal Web desenvolvido por Pablo Araújo</span>
            <span aria-hidden="true">•</span>
            <a href="https://github.com/Pabl0125" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors focus-visible:outline-gold">GitHub</a>
            <span aria-hidden="true">•</span>
            <a href="mailto:contacto@cernapensamento.org" className="hover:text-gold transition-colors focus-visible:outline-gold">Contacto</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
